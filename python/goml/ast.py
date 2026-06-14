"""AST node classes for GOML."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, List, Optional


@dataclass
class GOMLNode:
    """Base node."""
    line: int = 0
    col: int = 0


@dataclass
class StringNode(GOMLNode):
    value: str = ""


@dataclass
class NumberNode(GOMLNode):
    value: float | int = 0


@dataclass
class BooleanNode(GOMLNode):
    value: bool = False


@dataclass
class NullNode(GOMLNode):
    pass


@dataclass
class ReferenceNode(GOMLNode):
    path: str = ""


@dataclass
class ArrayNode(GOMLNode):
    items: List[GOMLNode] = field(default_factory=list)


@dataclass
class ObjectNode(GOMLNode):
    entries: List[KeyValueNode] = field(default_factory=list)


@dataclass
class KeyValueNode(GOMLNode):
    key: str = ""
    value: GOMLNode = field(default_factory=GOMLNode)


@dataclass
class ArrayOfObjectsNode(GOMLNode):
    key: str = ""
    items: List[ObjectNode] = field(default_factory=list)


@dataclass
class RootNode(GOMLNode):
    statements: List[GOMLNode] = field(default_factory=list)
