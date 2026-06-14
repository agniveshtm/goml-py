"""GOML - Go Markup Language parser and serializer for Python."""

from __future__ import annotations

from typing import Any, List, TextIO

from .errors import GOMLError, ParseError, SerializeError, TokenError
from .lexer import Token, TokenType, tokenize
from .parser import Parser, loads, loads_all
from .dumps import dump, dumps

__version__ = "0.1.0"
__all__ = [
    "loads",
    "loads_all",
    "dumps",
    "dump",
    "load",
    "load_all",
    "GOMLError",
    "ParseError",
    "SerializeError",
    "TokenError",
    "Token",
    "TokenType",
    "tokenize",
    "Parser",
]


def load(fp: TextIO, **kwargs: Any) -> dict:
    """Read GOML from a file object and return a dict."""
    return loads(fp.read(), **kwargs)


def load_all(fp: TextIO, **kwargs: Any) -> List[dict]:
    """Read GOML from a file object and return a list of dicts."""
    return loads_all(fp.read(), **kwargs)
