"""Token definitions and tokenizer for GOML."""

from enum import Enum, auto
from typing import List, NamedTuple

from .errors import TokenError


class TokenType(Enum):
    IDENT = auto()
    STRING = auto()
    NUMBER = auto()
    BOOLEAN = auto()
    NULL = auto()
    LBRACE = auto()
    RBRACE = auto()
    LBRACKET = auto()
    RBRACKET = auto()
    EQUALS = auto()
    COMMA = auto()
    DOT = auto()
    DOLLAR = auto()
    PIPE = auto()
    NEWLINE = auto()
    EOF = auto()


class Token(NamedTuple):
    type: TokenType
    value: object
    line: int
    col: int

    def __repr__(self):
        return f"Token({self.type.name}, {self.value!r}, line={self.line}, col={self.col})"


KEYWORDS = {
    "true": (TokenType.BOOLEAN, True),
    "false": (TokenType.BOOLEAN, False),
    "null": (TokenType.NULL, None),
    "~": (TokenType.NULL, None),
}

SINGLE_CHARS = {
    "{": TokenType.LBRACE,
    "}": TokenType.RBRACE,
    "[": TokenType.LBRACKET,
    "]": TokenType.RBRACKET,
    "=": TokenType.EQUALS,
    ",": TokenType.COMMA,
    ".": TokenType.DOT,
    "$": TokenType.DOLLAR,
    "|": TokenType.PIPE,
}


def tokenize(source: str) -> List[Token]:
    """Tokenize GOML source into a list of tokens."""
    tokens: List[Token] = []
    i = 0
    line = 1
    col = 1
    length = len(source)

    def advance() -> str:
        nonlocal i, line, col
        ch = source[i]
        i += 1
        if ch == "\n":
            line += 1
            col = 1
        else:
            col += 1
        return ch

    def peek(offset: int = 0) -> str:
        pos = i + offset
        if pos < length:
            return source[pos]
        return ""

    def skip_whitespace():
        nonlocal i, col
        while i < length and source[i] in " \t\r":
            if source[i] == "\t":
                col += 1
            else:
                col += 1
            i += 1

    def read_string(quote: str) -> str:
        nonlocal i, line, col
        start_line, start_col = line, col
        i += 1  # skip opening quote
        col += 1
        result: List[str] = []
        escape = False
        while i < length:
            ch = source[i]
            if escape:
                escape = False
                if ch == "n":
                    result.append("\n")
                elif ch == "t":
                    result.append("\t")
                elif ch == "\\":
                    result.append("\\")
                elif ch == quote:
                    result.append(quote)
                else:
                    result.append("\\" + ch)
                i += 1
                col += 1
            elif ch == "\\":
                escape = True
                i += 1
                col += 1
            elif ch == quote:
                i += 1
                col += 1
                return "".join(result)
            elif ch == "\n":
                line += 1
                col = 1
                i += 1
                result.append(ch)
            else:
                result.append(ch)
                i += 1
                col += 1
        raise TokenError("Unterminated string", start_line, start_col)

    def read_number() -> str:
        nonlocal i, col
        start = i
        if i < length and source[i] == "-":
            i += 1
            col += 1
        # Read digits
        while i < length and source[i].isdigit():
            i += 1
            col += 1
        # Read optional decimal part
        if i < length and source[i] == ".":
            # Peek ahead to see if this is part of a dotted identifier
            j = i + 1
            has_digit_after_dot = j < length and source[j].isdigit()
            if has_digit_after_dot:
                # Check if there are more dots after the decimal digits
                k = j + 1
                while k < length and source[k].isdigit():
                    k += 1
                if k < length and source[k] == ".":
                    # Multiple dots - this is an identifier like 192.168.1.1
                    # Return just the digits before the first dot
                    return source[start:i]
                # Single dot with digits - valid float
                i += 1
                col += 1
                while i < length and source[i].isdigit():
                    i += 1
                    col += 1
        return source[start:i]

    def read_ident() -> str:
        nonlocal i, col
        start = i
        while i < length and (source[i].isalnum() or source[i] in "_-"):
            i += 1
            col += 1
        return source[start:i]

    def read_ident_with_dots(prefix: str) -> str:
        nonlocal i, col
        result = prefix
        while i < length and source[i] == ".":
            result += source[i]
            i += 1
            col += 1
            # Read next part (digit or alpha)
            start_part = i
            while i < length and (source[i].isalnum() or source[i] in "_-"):
                i += 1
                col += 1
            result += source[start_part:i]
        return result

    def add_token(tok_type: TokenType, value: object):
        tokens.append(Token(tok_type, value, line, col))

    while i < length:
        ch = source[i]

        # Newlines
        if ch == "\n":
            advance()
            tokens.append(Token(TokenType.NEWLINE, "\n", line, col))
            continue

        # Skip whitespace (not newlines)
        if ch in " \t\r":
            skip_whitespace()
            continue

        # Comment
        if ch == "#":
            start_line, start_col = line, col
            while i < length and source[i] != "\n":
                advance()
            continue

        # String
        if ch == '"':
            start_line, start_col = line, col
            val = read_string('"')
            tokens.append(Token(TokenType.STRING, val, start_line, start_col))
            continue
        if ch == "'":
            start_line, start_col = line, col
            val = read_string("'")
            tokens.append(Token(TokenType.STRING, val, start_line, start_col))
            continue

        # Number (negative sign followed by digit)
        if ch == "-" and i + 1 < length and source[i + 1].isdigit():
            start_line, start_col = line, col
            num_str = read_number()
            # Check if this is actually part of a dotted identifier
            if i < length and source[i] == ".":
                # Read the rest as an identifier
                ident = read_ident_with_dots(num_str)
                tokens.append(Token(TokenType.IDENT, ident, start_line, start_col))
            elif "." in num_str:
                tokens.append(Token(TokenType.NUMBER, float(num_str), start_line, start_col))
            else:
                tokens.append(Token(TokenType.NUMBER, int(num_str), start_line, start_col))
            continue

        # Number
        if ch.isdigit():
            start_line, start_col = line, col
            num_str = read_number()
            # Check if this is actually part of a dotted identifier
            if i < length and source[i] == ".":
                # Read the rest as an identifier
                ident = read_ident_with_dots(num_str)
                tokens.append(Token(TokenType.IDENT, ident, start_line, start_col))
            elif "." in num_str:
                tokens.append(Token(TokenType.NUMBER, float(num_str), start_line, start_col))
            else:
                tokens.append(Token(TokenType.NUMBER, int(num_str), start_line, start_col))
            continue

        # Tilde for null
        if ch == "~":
            start_line, start_col = line, col
            advance()
            tokens.append(Token(TokenType.NULL, None, start_line, start_col))
            continue

        # Single character tokens
        if ch in SINGLE_CHARS:
            tok_type = SINGLE_CHARS[ch]
            advance()
            tokens.append(Token(tok_type, ch, line, col))
            continue

        # Identifiers / keywords
        if ch.isalpha() or ch == "_":
            start_line, start_col = line, col
            ident = read_ident()
            if ident in KEYWORDS:
                tok_type, val = KEYWORDS[ident]
                tokens.append(Token(tok_type, val, start_line, start_col))
            else:
                tokens.append(Token(TokenType.IDENT, ident, start_line, start_col))
            continue

        raise TokenError(f"Unexpected character: {ch!r}", line, col)

    tokens.append(Token(TokenType.EOF, None, line, col))
    return tokens
