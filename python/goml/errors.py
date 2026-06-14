"""Custom exceptions for GOML parsing and serialization."""


class GOMLError(Exception):
    """Base exception for all GOML errors."""

    def __init__(self, message: str, line: int = 0, col: int = 0):
        self.line = line
        self.col = col
        if line or col:
            message = f"Line {line}, Col {col}: {message}"
        super().__init__(message)


class TokenError(GOMLError):
    """Raised for invalid or unexpected tokens."""
    pass


class ParseError(GOMLError):
    """Raised when the parser encounters unexpected input."""
    pass


class SerializeError(GOMLError):
    """Raised when serialization fails."""
    pass
