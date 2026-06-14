export { parse, Parser } from './parser';
export { stringify, dumps } from './serializer';
export { Tokenizer, TokenType, type Token, isIdent } from './lexer';
export { GomlError, ParseError, TokenError, SerializeError } from './errors';
export type {
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

import { readFileSync, writeFileSync } from 'fs';
import { parse } from './parser';
import { stringify } from './serializer';

export function loads(input: string): { [key: string]: any } {
  return parse(input);
}

export function load(filePath: string): { [key: string]: any } {
  const content = readFileSync(filePath, 'utf-8');
  return parse(content);
}

export function dump(obj: any, filePath: string, indent: number = 2): void {
  const content = stringify(obj, indent);
  writeFileSync(filePath, content, 'utf-8');
}
