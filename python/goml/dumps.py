"""Serializer: Python dicts/lists to GOML format."""

from __future__ import annotations

from io import StringIO
from typing import Any, TextIO

from .errors import SerializeError


def dumps(obj: Any, indent: int = 2) -> str:
    """Serialize a Python object to GOML string."""
    buf = StringIO()
    _serialize(obj, buf, indent, 0)
    return buf.getvalue().rstrip("\n") + "\n"


def dump(obj: Any, fp: TextIO, indent: int = 2) -> None:
    """Serialize a Python object to a file-like object."""
    fp.write(dumps(obj, indent))


def _needs_quote(s: str) -> bool:
    """Check if a string needs quoting."""
    if not s:
        return True
    if s in ("true", "false", "null", "~"):
        return True
    for ch in s:
        if ch in ' \t\n\r#={}[],|.$"\'':
            return True
    if s.lstrip("-").isdigit():
        return True
    try:
        float(s)
        return True
    except ValueError:
        pass
    if s[0].isdigit() or s[0] == "-":
        return True
    return False


def _serialize_string(s: str, buf: TextIO, indent_level: int) -> None:
    if not _needs_quote(s):
        buf.write(s)
        return
    # Use double quotes, escape as needed
    escaped = s.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n").replace("\t", "\\t")
    buf.write(f'"{escaped}"')


def _serialize(obj: Any, buf: TextIO, indent: int, level: int) -> None:
    prefix = " " * (indent * level)

    if obj is None:
        buf.write("null")
    elif isinstance(obj, bool):
        buf.write("true" if obj else "false")
    elif isinstance(obj, int):
        buf.write(str(obj))
    elif isinstance(obj, float):
        buf.write(str(obj))
    elif isinstance(obj, str):
        if obj.startswith("__ref__:"):
            buf.write("$" + obj[8:])
        else:
            _serialize_string(obj, buf, level)
    elif isinstance(obj, list):
        _serialize_list(obj, buf, indent, level)
    elif isinstance(obj, dict):
        _serialize_dict(obj, buf, indent, level)
    else:
        raise SerializeError(f"Cannot serialize type {type(obj).__name__}")


def _serialize_list(obj: list, buf: TextIO, indent: int, level: int) -> None:
    if not obj:
        buf.write("[]")
        return

    # Check if all items are dicts (array of objects)
    all_dicts = all(isinstance(item, dict) for item in obj)
    if all_dicts:
        _serialize_array_of_dicts(obj, buf, indent, level)
        return

    # Check if items are simple enough for single-line
    simple = all(
        isinstance(item, (int, float, str, bool, type(None)))
        for item in obj
    )
    if simple:
        buf.write("[")
        for i, item in enumerate(obj):
            if i > 0:
                buf.write(", ")
            _serialize(item, buf, indent, level)
        buf.write("]")
    else:
        buf.write("[\n")
        inner_prefix = " " * (indent * (level + 1))
        for i, item in enumerate(obj):
            buf.write(inner_prefix)
            _serialize(item, buf, indent, level + 1)
            if i < len(obj) - 1:
                buf.write("\n")
        buf.write("\n")
        buf.write(" " * (indent * level))
        buf.write("]")


def _serialize_array_of_dicts(obj: list, buf: TextIO, indent: int, level: int) -> None:
    prefix = " " * (indent * level)
    inner_prefix = " " * (indent * (level + 1))
    buf.write("[\n")
    for i, item in enumerate(obj):
        buf.write(inner_prefix)
        buf.write("{\n")
        _serialize_dict_body(item, buf, indent, level + 2)
        buf.write(inner_prefix)
        buf.write("}")
        if i < len(obj) - 1:
            buf.write("\n")
    buf.write("\n")
    buf.write(prefix)
    buf.write("]")


def _serialize_dict(obj: dict, buf: TextIO, indent: int, level: int) -> None:
    if not obj:
        buf.write("{}")
        return
    buf.write("{\n")
    _serialize_dict_body(obj, buf, indent, level + 1)
    buf.write(" " * (indent * level))
    buf.write("}")


def _serialize_dict_body(obj: dict, buf: TextIO, indent: int, level: int) -> None:
    prefix = " " * (indent * level)
    items = list(obj.items())
    for i, (key, value) in enumerate(items):
        buf.write(prefix)
        _serialize_string(key, buf, level)
        if isinstance(value, dict):
            buf.write(" ")
            _serialize(value, buf, indent, level)
        elif isinstance(value, list) and value and all(isinstance(v, dict) for v in value):
            # Array of objects syntax
            buf.write(" ")
            _serialize_array_of_dicts(value, buf, indent, level)
        else:
            buf.write(" = ")
            _serialize(value, buf, indent, level)
        if i < len(items) - 1:
            buf.write("\n")
        else:
            buf.write("\n")
