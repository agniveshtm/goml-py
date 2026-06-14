export interface Document {
  type: 'Document';
  entries: GomlNode[];
}

export interface KeyValue {
  type: 'KeyValue';
  key: string;
  value: GomlValue;
  line: number;
  col: number;
}

export interface BlockObject {
  type: 'Object';
  name: string;
  entries: GomlNode[];
  line: number;
  col: number;
}

export interface BlockArray {
  type: 'Array';
  name: string;
  items: GomlValue[];
  line: number;
  col: number;
}

export interface CommentNode {
  type: 'Comment';
  text: string;
  line: number;
  col: number;
}

export interface StringValue {
  type: 'String';
  value: string;
  line: number;
  col: number;
}

export interface NumberValue {
  type: 'Number';
  value: number;
  raw: string;
  line: number;
  col: number;
}

export interface BooleanValue {
  type: 'Boolean';
  value: boolean;
  line: number;
  col: number;
}

export interface NullValue {
  type: 'Null';
  line: number;
  col: number;
}

export interface ArrayValue {
  type: 'ArrayValue';
  items: GomlValue[];
  line: number;
  col: number;
}

export interface InlineObject {
  type: 'InlineObject';
  entries: KeyValue[];
  line: number;
  col: number;
}

export interface ReferenceValue {
  type: 'Reference';
  path: string;
  line: number;
  col: number;
}

export type GomlValue =
  | StringValue
  | NumberValue
  | BooleanValue
  | NullValue
  | ArrayValue
  | InlineObject
  | ReferenceValue;

export type GomlNode = KeyValue | BlockObject | BlockArray | CommentNode;
