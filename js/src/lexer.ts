import { TokenError } from './errors';

export enum TokenType {
  Ident = 'IDENT',
  String = 'STRING',
  Number = 'NUMBER',
  Boolean = 'BOOLEAN',
  Null = 'NULL',
  LBrace = 'LBRACE',
  RBrace = 'RBRACE',
  LBracket = 'LBRACKET',
  RBracket = 'RBRACKET',
  Equals = 'EQUALS',
  Comma = 'COMMA',
  Dot = 'DOT',
  Dollar = 'DOLLAR',
  Newline = 'NEWLINE',
  Comment = 'COMMENT',
  Eof = 'EOF',
}

export interface Token {
  type: TokenType;
  literal: string;
  line: number;
  col: number;
}

export class Tokenizer {
  private input: string;
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;
  private tokens: Token[] = [];
  private peeked: Token | null = null;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const ch = this.input[this.pos];

      if (ch === '#') {
        this.scanComment();
      } else if (ch === '/' && this.peekChar() === '/') {
        this.scanLineComment();
      } else if (ch === '"' || ch === "'") {
        this.scanString();
      } else if (ch === '{') {
        this.addToken(TokenType.LBrace, '{');
        this.advance();
      } else if (ch === '}') {
        this.addToken(TokenType.RBrace, '}');
        this.advance();
      } else if (ch === '[') {
        this.addToken(TokenType.LBracket, '[');
        this.advance();
      } else if (ch === ']') {
        this.addToken(TokenType.RBracket, ']');
        this.advance();
      } else if (ch === '=') {
        this.addToken(TokenType.Equals, '=');
        this.advance();
      } else if (ch === ',') {
        this.addToken(TokenType.Comma, ',');
        this.advance();
      } else if (ch === '.') {
        this.addToken(TokenType.Dot, '.');
        this.advance();
      } else if (ch === '$') {
        this.addToken(TokenType.Dollar, '$');
        this.advance();
      } else if (ch === '~') {
        this.addToken(TokenType.Null, 'null');
        this.advance();
      } else if (ch === '-' || this.isDigit(ch)) {
        this.scanNumber();
      } else if (this.isIdentStart(ch)) {
        this.scanIdent();
      } else {
        throw new TokenError(
          `Unexpected character: '${ch}'`,
          this.line,
          this.col
        );
      }
    }

    this.addToken(TokenType.Eof, '');
    return this.tokens;
  }

  peek(): Token {
    if (this.peeked) return this.peeked;
    const saved = { pos: this.pos, line: this.line, col: this.col, tokens: this.tokens.length };
    const tokens = this.tokenize();
    this.peeked = tokens[tokens.length - 1] || { type: TokenType.Eof, literal: '', line: this.line, col: this.col };
    this.pos = saved.pos;
    this.line = saved.line;
    this.col = saved.col;
    this.tokens = this.tokens.slice(0, saved.tokens);
    return this.peeked;
  }

  private peekChar(): string {
    if (this.pos + 1 >= this.input.length) return '\0';
    return this.input[this.pos + 1];
  }

  private advance(): void {
    this.pos++;
    this.col++;
  }

  private addToken(type: TokenType, literal: string): void {
    this.tokens.push({ type, literal, line: this.line, col: this.col });
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
      } else if (ch === '\n') {
        this.addToken(TokenType.Newline, '\n');
        this.pos++;
        this.line++;
        this.col = 1;
      } else {
        break;
      }
    }
  }

  private scanComment(): void {
    const start = this.pos;
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      this.pos++;
    }
    this.addToken(TokenType.Comment, this.input.substring(start, this.pos));
  }

  private scanLineComment(): void {
    const start = this.pos;
    this.pos += 2;
    this.col += 2;
    while (this.pos < this.input.length && this.input[this.pos] !== '\n') {
      this.pos++;
    }
    this.addToken(TokenType.Comment, this.input.substring(start, this.pos));
  }

  private scanString(): void {
    const quote = this.input[this.pos];
    const startLine = this.line;
    const startCol = this.col;
    this.advance();

    let result = '';
    while (this.pos < this.input.length) {
      const ch = this.input[this.pos];
      if (ch === '\n') {
        throw new TokenError(
          `Unterminated string at ${startLine}:${startCol}`,
          startLine,
          startCol
        );
      }
      if (ch === '\\' && this.pos + 1 < this.input.length) {
        this.advance();
        const escaped = this.input[this.pos];
        switch (escaped) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case '\\': result += '\\'; break;
          case '"': result += '"'; break;
          case "'": result += "'"; break;
          default: result += '\\' + escaped; break;
        }
      } else if (ch === quote) {
        this.advance();
        this.addToken(TokenType.String, result);
        return;
      } else {
        result += ch;
      }
      this.advance();
    }
    throw new TokenError(
      `Unterminated string at ${startLine}:${startCol}`,
      startLine,
      startCol
    );
  }

  private scanNumber(): void {
    const start = this.pos;
    const startCol = this.col;
    if (this.input[this.pos] === '-') {
      this.advance();
    }
    while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
      this.advance();
    }
    if (this.pos < this.input.length && this.input[this.pos] === '.') {
      this.advance();
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        this.advance();
      }
    }
    this.addToken(TokenType.Number, this.input.substring(start, this.pos));
  }

  private scanIdent(): void {
    const start = this.pos;
    while (this.pos < this.input.length && this.isIdentChar(this.input[this.pos])) {
      this.pos++;
      this.col++;
    }
    const word = this.input.substring(start, this.pos);
    switch (word) {
      case 'true':
      case 'false':
        this.addToken(TokenType.Boolean, word);
        break;
      case 'null':
        this.addToken(TokenType.Null, word);
        break;
      default:
        this.addToken(TokenType.Ident, word);
        break;
    }
  }

  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  private isIdentStart(ch: string): boolean {
    return (
      (ch >= 'a' && ch <= 'z') ||
      (ch >= 'A' && ch <= 'Z') ||
      ch === '_' ||
      ch === '-' ||
      ch === '.'
    );
  }

  private isIdentChar(ch: string): boolean {
    return this.isIdentStart(ch) || this.isDigit(ch);
  }
}

export function isIdent(s: string): boolean {
  if (s.length === 0) return false;
  const first = s[0];
  if (
    !((first >= 'a' && first <= 'z') || (first >= 'A' && first <= 'Z') || first === '_' || first === '-')
  ) {
    return false;
  }
  for (let i = 1; i < s.length; i++) {
    const ch = s[i];
    if (
      !(
        (ch >= 'a' && ch <= 'z') ||
        (ch >= 'A' && ch <= 'Z') ||
        (ch >= '0' && ch <= '9') ||
        ch === '_' ||
        ch === '-' ||
        ch === '.'
      )
    ) {
      return false;
    }
  }
  return true;
}
