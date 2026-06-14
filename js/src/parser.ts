import { Tokenizer, Token, TokenType } from './lexer';
import { ParseError } from './errors';
import {
  Document,
  GomlNode,
  GomlValue,
  KeyValue,
  BlockObject,
  BlockArray,
  CommentNode,
  StringValue,
  NumberValue,
  BooleanValue,
  NullValue,
  ArrayValue,
  InlineObject,
  ReferenceValue,
} from './ast';

export class Parser {
  private tokens: Token[] = [];
  private pos: number = 0;

  parse(input: string): Document {
    const tokenizer = new Tokenizer(input);
    this.tokens = tokenizer.tokenize();
    this.pos = 0;

    const entries: GomlNode[] = [];
    while (!this.isAtEnd()) {
      this.skipNewlinesAndComments(entries);
      if (this.isAtEnd()) break;

      const token = this.current();
      if (token.type === TokenType.Newline || token.type === TokenType.Comment) {
        this.advance();
        continue;
      }

      if (token.type === TokenType.Ident) {
        entries.push(this.parseStatement());
      } else if (token.type === TokenType.RBrace || token.type === TokenType.RBracket) {
        break;
      } else {
        throw new ParseError(
          `Unexpected token '${token.literal}' at ${token.line}:${token.col}`,
          token.line,
          token.col
        );
      }

      this.skipNewlinesAndComments(entries);
    }

    return { type: 'Document', entries };
  }

  private parseStatement(): GomlNode {
    const nameToken = this.expect(TokenType.Ident);
    const name = nameToken.literal;

    this.skipNewlinesAndComments();

    if (this.check(TokenType.LBrace)) {
      return this.parseBlockObject(nameToken);
    }

    if (this.check(TokenType.LBracket)) {
      return this.parseBlockArray(nameToken);
    }

    this.expect(TokenType.Equals);
    this.skipNewlinesAndComments();
    const value = this.parseValue();

    return {
      type: 'KeyValue',
      key: name,
      value,
      line: nameToken.line,
      col: nameToken.col,
    };
  }

  private parseBlockObject(nameToken: Token): BlockObject {
    this.expect(TokenType.LBrace);
    this.skipNewlinesAndComments();

    const entries: GomlNode[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      if (this.check(TokenType.Newline)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.Comment)) {
        entries.push(this.parseComment());
        continue;
      }

      if (this.check(TokenType.RBrace)) break;

      const token = this.current();
      if (token.type === TokenType.Ident) {
        entries.push(this.parseStatement());
        this.skipNewlinesAndComments();
      } else {
        throw new ParseError(
          `Unexpected token '${token.literal}' at ${token.line}:${token.col}`,
          token.line,
          token.col
        );
      }

      this.skipNewlinesAndComments();
    }

    this.expect(TokenType.RBrace);

    return {
      type: 'Object',
      name: nameToken.literal,
      entries,
      line: nameToken.line,
      col: nameToken.col,
    };
  }

  private parseBlockArray(nameToken: Token): BlockArray {
    this.expect(TokenType.LBracket);
    this.skipNewlinesAndComments();

    const items: GomlValue[] = [];
    while (!this.check(TokenType.RBracket) && !this.isAtEnd()) {
      if (this.check(TokenType.Newline)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.Comment)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.RBracket)) break;

      const token = this.current();
      if (token.type === TokenType.LBrace) {
        const obj = this.parseInlineObject();
        items.push(obj);
      } else {
        throw new ParseError(
          `Expected object in array at ${token.line}:${token.col}`,
          token.line,
          token.col
        );
      }

      this.skipComma();
      this.skipNewlinesAndComments();
    }

    this.expect(TokenType.RBracket);

    return {
      type: 'Array',
      name: nameToken.literal,
      items,
      line: nameToken.line,
      col: nameToken.col,
    };
  }

  private parseInlineObject(): InlineObject {
    this.expect(TokenType.LBrace);
    this.skipNewlinesAndComments();

    const entries: KeyValue[] = [];
    while (!this.check(TokenType.RBrace) && !this.isAtEnd()) {
      if (this.check(TokenType.Newline)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.Comment)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.RBrace)) break;

      const token = this.current();
      if (token.type === TokenType.Ident) {
        const keyToken = this.expect(TokenType.Ident);
        this.expect(TokenType.Equals);
        this.skipNewlinesAndComments();
        const value = this.parseValue();
        entries.push({
          type: 'KeyValue',
          key: keyToken.literal,
          value,
          line: keyToken.line,
          col: keyToken.col,
        });
        this.skipComma();
      } else {
        throw new ParseError(
          `Unexpected token '${token.literal}' at ${token.line}:${token.col}`,
          token.line,
          token.col
        );
      }

      this.skipNewlinesAndComments();
    }

    this.expect(TokenType.RBrace);

    return {
      type: 'InlineObject',
      entries,
      line: entries[0]?.line ?? 0,
      col: entries[0]?.col ?? 0,
    };
  }

  private parseValue(): GomlValue {
    this.skipNewlinesAndComments();
    const token = this.current();

    switch (token.type) {
      case TokenType.String:
        this.advance();
        return {
          type: 'String',
          value: token.literal,
          line: token.line,
          col: token.col,
        };

      case TokenType.Number:
        this.advance();
        return {
          type: 'Number',
          value: token.literal.includes('.') ? parseFloat(token.literal) : parseInt(token.literal, 10),
          raw: token.literal,
          line: token.line,
          col: token.col,
        };

      case TokenType.Boolean:
        this.advance();
        return {
          type: 'Boolean',
          value: token.literal === 'true',
          line: token.line,
          col: token.col,
        };

      case TokenType.Null:
        this.advance();
        return {
          type: 'Null',
          line: token.line,
          col: token.col,
        };

      case TokenType.Dollar:
        return this.parseReference();

      case TokenType.LBracket:
        return this.parseArrayValue();

      case TokenType.Ident:
        this.advance();
        return {
          type: 'String',
          value: token.literal,
          line: token.line,
          col: token.col,
        };

      default:
        throw new ParseError(
          `Unexpected token '${token.literal}' at ${token.line}:${token.col}`,
          token.line,
          token.col
        );
    }
  }

  private parseReference(): ReferenceValue {
    const dollarToken = this.expect(TokenType.Dollar);
    let path = '';

    if (this.check(TokenType.Ident)) {
      path = this.advance().literal;
    }

    while (this.check(TokenType.Dot)) {
      this.advance();
      if (this.check(TokenType.Ident)) {
        path += '.' + this.advance().literal;
      }
    }

    return {
      type: 'Reference',
      path: '__ref__:' + path,
      line: dollarToken.line,
      col: dollarToken.col,
    };
  }

  private parseArrayValue(): ArrayValue {
    const bracketToken = this.expect(TokenType.LBracket);
    this.skipNewlinesAndComments();

    const items: GomlValue[] = [];
    while (!this.check(TokenType.RBracket) && !this.isAtEnd()) {
      if (this.check(TokenType.Newline)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.Comma)) {
        this.advance();
        continue;
      }

      if (this.check(TokenType.RBracket)) break;

      items.push(this.parseValue());

      if (this.check(TokenType.Comma)) {
        this.advance();
      }

      this.skipNewlinesAndComments();
    }

    this.expect(TokenType.RBracket);

    return {
      type: 'ArrayValue',
      items,
      line: bracketToken.line,
      col: bracketToken.col,
    };
  }

  private parseComment(): CommentNode {
    const token = this.expect(TokenType.Comment);
    return {
      type: 'Comment',
      text: token.literal,
      line: token.line,
      col: token.col,
    };
  }

  private skipNewlinesAndComments(entries?: GomlNode[]): void {
    while (!this.isAtEnd()) {
      const token = this.current();
      if (token.type === TokenType.Newline) {
        this.advance();
      } else if (token.type === TokenType.Comment) {
        if (entries) {
          entries.push(this.parseComment());
        } else {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private skipComma(): void {
    if (this.check(TokenType.Comma)) {
      this.advance();
    }
  }

  private current(): Token {
    if (this.pos >= this.tokens.length) {
      return { type: TokenType.Eof, literal: '', line: 0, col: 0 };
    }
    return this.tokens[this.pos];
  }

  private check(type: TokenType): boolean {
    return this.current().type === type;
  }

  private advance(): Token {
    const token = this.current();
    if (this.pos < this.tokens.length) {
      this.pos++;
    }
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new ParseError(
        `Expected ${type} but got ${token.type} '${token.literal}' at ${token.line}:${token.col}`,
        token.line,
        token.col
      );
    }
    return this.advance();
  }

  private isAtEnd(): boolean {
    return this.pos >= this.tokens.length || this.current().type === TokenType.Eof;
  }
}

export function parse(input: string): { [key: string]: any } {
  const parser = new Parser();
  const doc = parser.parse(input);
  return convertDocument(doc);
}

function convertDocument(doc: Document): { [key: string]: any } {
  const result: { [key: string]: any } = {};
  for (const entry of doc.entries) {
    const converted = convertNode(entry);
    if (converted) {
      Object.assign(result, converted);
    }
  }
  return result;
}

function convertNode(node: GomlNode): { [key: string]: any } | null {
  switch (node.type) {
    case 'KeyValue': {
      return { [node.key]: convertValue(node.value) };
    }
    case 'Object': {
      const obj: { [key: string]: any } = {};
      for (const entry of node.entries) {
        const converted = convertNode(entry);
        if (converted) {
          Object.assign(obj, converted);
        }
      }
      return { [node.name]: obj };
    }
    case 'Array': {
      const arr: any[] = node.items.map((item) => convertValue(item));
      return { [node.name]: arr };
    }
    case 'Comment':
      return null;
    default:
      return null;
  }
}

function convertValue(value: GomlValue): any {
  switch (value.type) {
    case 'String':
      return value.value;
    case 'Number':
      return value.value;
    case 'Boolean':
      return value.value;
    case 'Null':
      return null;
    case 'Reference':
      return value.path;
    case 'ArrayValue':
      return value.items.map((item) => convertValue(item));
    case 'InlineObject': {
      const obj: { [key: string]: any } = {};
      for (const entry of value.entries) {
        obj[entry.key] = convertValue(entry.value);
      }
      return obj;
    }
    default:
      return null;
  }
}
