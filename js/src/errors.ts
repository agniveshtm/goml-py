export class GomlError extends Error {
  line: number;
  col: number;

  constructor(message: string, line: number, col: number) {
    super(message);
    this.name = 'GomlError';
    this.line = line;
    this.col = col;
  }
}

export class ParseError extends GomlError {
  constructor(message: string, line: number, col: number) {
    super(message, line, col);
    this.name = 'ParseError';
  }
}

export class TokenError extends GomlError {
  constructor(message: string, line: number, col: number) {
    super(message, line, col);
    this.name = 'TokenError';
  }
}

export class SerializeError extends GomlError {
  constructor(message: string, line: number = 0, col: number = 0) {
    super(message, line, col);
    this.name = 'SerializeError';
  }
}
