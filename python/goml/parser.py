"""Recursive descent parser for GOML."""

from __future__ import annotations

from typing import Any, List, Optional

from .ast import (
    ArrayNode,
    ArrayOfObjectsNode,
    BooleanNode,
    GOMLNode,
    KeyValueNode,
    NullNode,
    NumberNode,
    ObjectNode,
    ReferenceNode,
    RootNode,
    StringNode,
)
from .errors import ParseError
from .lexer import Token, TokenType, tokenize


class Parser:
    """Recursive descent parser that produces Python dicts/lists from GOML tokens."""

    def __init__(self, source: str):
        self.tokens = tokenize(source)
        self.pos = 0

    def peek(self, offset: int = 0) -> Token:
        idx = self.pos + offset
        if idx < len(self.tokens):
            return self.tokens[idx]
        return self.tokens[-1]  # EOF

    def advance(self) -> Token:
        tok = self.tokens[self.pos]
        self.pos += 1
        return tok

    def expect(self, tok_type: TokenType) -> Token:
        tok = self.peek()
        if tok.type != tok_type:
            raise ParseError(
                f"Expected {tok_type.name}, got {tok.type.name} ({tok.value!r})",
                tok.line,
                tok.col,
            )
        return self.advance()

    def skip_newlines(self):
        while self.peek().type == TokenType.NEWLINE:
            self.advance()

    def parse_root(self) -> RootNode:
        root = RootNode()
        self.skip_newlines()
        while self.peek().type != TokenType.EOF:
            stmt = self.parse_statement()
            if stmt is not None:
                root.statements.append(stmt)
            self.skip_newlines()
        return root

    def parse_statement(self) -> Optional[GOMLNode]:
        tok = self.peek()

        if tok.type == TokenType.IDENT:
            return self.parse_ident_statement()
        elif tok.type == TokenType.DOLLAR:
            return self.parse_ident_statement()
        else:
            # skip unexpected tokens
            self.advance()
            return None

    def parse_ident_statement(self) -> GOMLNode:
        """Parse key = value, key { ... }, or key [ { ... } ]."""
        if self.peek().type == TokenType.DOLLAR:
            ref_tok = self.advance()
            # Build dotted path: $a.b.c
            path_parts: List[str] = []
            tok = self.peek()
            if tok.type == TokenType.IDENT:
                path_parts.append(tok.value)
                self.advance()
            while self.peek().type == TokenType.DOT:
                self.advance()  # consume dot
                name_tok = self.expect(TokenType.IDENT)
                path_parts.append(name_tok.value)
            ref_path = ".".join(path_parts)
            # Could be $ref = value or $ref alone
            return ReferenceNode(path=ref_path, line=ref_tok.line, col=ref_tok.col)

        key_tok = self.advance()  # IDENT
        key = key_tok.value

        self.skip_newlines()

        next_tok = self.peek()

        if next_tok.type == TokenType.EQUALS:
            self.advance()  # consume =
            self.skip_newlines()
            value = self.parse_value()
            return KeyValueNode(key=key, value=value, line=key_tok.line, col=key_tok.col)

        if next_tok.type == TokenType.LBRACE:
            self.advance()  # consume {
            obj = self.parse_object_body()
            self.expect(TokenType.RBRACE)
            return KeyValueNode(key=key, value=obj, line=key_tok.line, col=key_tok.col)

        if next_tok.type == TokenType.LBRACKET:
            self.advance()  # consume [
            self.skip_newlines()
            if self.peek().type == TokenType.LBRACE:
                # Array of objects: items [ { ... } { ... } ]
                arr = self.parse_array_of_objects()
                self.expect(TokenType.RBRACKET)
                return KeyValueNode(key=key, value=arr, line=key_tok.line, col=key_tok.col)
            else:
                # Normal array
                arr = self.parse_array_items()
                self.expect(TokenType.RBRACKET)
                return KeyValueNode(key=key, value=arr, line=key_tok.line, col=key_tok.col)

        raise ParseError(
            f"Expected '=', '{{', or '[' after key '{key}', got {next_tok.type.name}",
            next_tok.line,
            next_tok.col,
        )

    def parse_value(self) -> GOMLNode:
        tok = self.peek()
        if tok.type == TokenType.STRING:
            self.advance()
            return StringNode(value=tok.value, line=tok.line, col=tok.col)
        if tok.type == TokenType.NUMBER:
            self.advance()
            return NumberNode(value=tok.value, line=tok.line, col=tok.col)
        if tok.type == TokenType.BOOLEAN:
            self.advance()
            return BooleanNode(value=tok.value, line=tok.line, col=tok.col)
        if tok.type == TokenType.NULL:
            self.advance()
            return NullNode(line=tok.line, col=tok.col)
        if tok.type == TokenType.IDENT:
            self.advance()
            return StringNode(value=tok.value, line=tok.line, col=tok.col)
        if tok.type == TokenType.LBRACKET:
            self.advance()
            items = self.parse_array_items()
            self.expect(TokenType.RBRACKET)
            return ArrayNode(items=items, line=tok.line, col=tok.col)
        if tok.type == TokenType.LBRACE:
            self.advance()
            obj = self.parse_object_body()
            self.expect(TokenType.RBRACE)
            return obj
        if tok.type == TokenType.DOLLAR:
            return self.parse_ref_value()
        raise ParseError(
            f"Unexpected token in value position: {tok.type.name} ({tok.value!r})",
            tok.line,
            tok.col,
        )

    def parse_ref_value(self) -> ReferenceNode:
        ref_tok = self.advance()  # consume $
        path_parts: List[str] = []
        tok = self.peek()
        if tok.type == TokenType.IDENT:
            path_parts.append(tok.value)
            self.advance()
        while self.peek().type == TokenType.DOT:
            self.advance()
            name_tok = self.expect(TokenType.IDENT)
            path_parts.append(name_tok.value)
        return ReferenceNode(path=".".join(path_parts), line=ref_tok.line, col=ref_tok.col)

    def parse_object_body(self) -> ObjectNode:
        obj = ObjectNode()
        self.skip_newlines()
        while self.peek().type not in (TokenType.RBRACE, TokenType.EOF):
            stmt = self.parse_statement()
            if stmt is not None:
                obj.entries.append(stmt)
            self.skip_newlines()
        return obj

    def parse_array_items(self) -> List[GOMLNode]:
        items: List[GOMLNode] = []
        self.skip_newlines()
        while self.peek().type not in (TokenType.RBRACKET, TokenType.EOF):
            items.append(self.parse_value())
            self.skip_newlines()
            if self.peek().type == TokenType.COMMA:
                self.advance()  # consume comma
                self.skip_newlines()
        return items

    def parse_array_of_objects(self) -> ArrayOfObjectsNode:
        arr = ArrayOfObjectsNode()
        self.skip_newlines()
        while self.peek().type != TokenType.RBRACKET:
            if self.peek().type == TokenType.LBRACE:
                self.advance()  # consume {
                obj = self.parse_object_body()
                self.expect(TokenType.RBRACE)
                arr.items.append(obj)
            else:
                break
            self.skip_newlines()
        return arr


def _node_to_python(node: GOMLNode) -> Any:
    """Convert an AST node to a native Python value."""
    if isinstance(node, StringNode):
        return node.value
    if isinstance(node, NumberNode):
        return node.value
    if isinstance(node, BooleanNode):
        return node.value
    if isinstance(node, NullNode):
        return None
    if isinstance(node, ReferenceNode):
        return f"__ref__:{node.path}"
    if isinstance(node, ArrayNode):
        return [_node_to_python(item) for item in node.items]
    if isinstance(node, ObjectNode):
        result = {}
        for entry in node.entries:
            if isinstance(entry, KeyValueNode):
                result[entry.key] = _node_to_python(entry.value)
        return result
    if isinstance(node, ArrayOfObjectsNode):
        return [_node_to_python(obj) for obj in node.items]
    if isinstance(node, RootNode):
        # If single top-level key-value, return dict directly
        # If multiple, return dict with all keys
        result = {}
        for stmt in node.statements:
            if isinstance(stmt, KeyValueNode):
                result[stmt.key] = _node_to_python(stmt.value)
        return result
    return None


def loads(source: str) -> dict:
    """Parse GOML string and return a Python dict."""
    parser = Parser(source)
    tree = parser.parse_root()
    result = _node_to_python(tree)
    if not isinstance(result, dict):
        return result or {}
    return result


def loads_all(source: str) -> List[dict]:
    """Parse GOML source with multiple root-level objects and return a list of dicts."""
    parser = Parser(source)
    tree = parser.parse_root()
    results = []
    for stmt in tree.statements:
        if isinstance(stmt, KeyValueNode):
            results.append({stmt.key: _node_to_python(stmt.value)})
    return results
