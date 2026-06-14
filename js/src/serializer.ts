import { SerializeError } from './errors';

export function stringify(obj: any, indent: number = 2): string {
  const lines: string[] = [];
  stringifyValue(obj, '', lines, indent, 0);
  return lines.join('\n') + '\n';
}

function stringifyValue(
  obj: any,
  prefix: string,
  lines: string[],
  indent: number,
  depth: number
): void {
  if (obj === null || obj === undefined) {
    lines.push(prefix + 'null');
    return;
  }

  if (typeof obj === 'boolean') {
    lines.push(prefix + (obj ? 'true' : 'false'));
    return;
  }

  if (typeof obj === 'number') {
    lines.push(prefix + obj.toString());
    return;
  }

  if (typeof obj === 'string') {
    if (obj.startsWith('__ref__:')) {
      lines.push(prefix + '$' + obj.slice(8));
    } else if (needsQuoting(obj)) {
      lines.push(prefix + '"' + escapeString(obj) + '"');
    } else {
      lines.push(prefix + obj);
    }
    return;
  }

  if (Array.isArray(obj)) {
    stringifyArray(obj, prefix, lines, indent, depth);
    return;
  }

  if (typeof obj === 'object') {
    stringifyObject(obj, prefix, lines, indent, depth);
    return;
  }

  throw new SerializeError(`Cannot serialize value of type ${typeof obj}`);
}

function stringifyObject(
  obj: { [key: string]: any },
  prefix: string,
  lines: string[],
  indent: number,
  depth: number
): void {
  const keys = Object.keys(obj);
  const nestedIndent = ' '.repeat(indent * depth);

  if (keys.length === 0) {
    lines.push(prefix + '{}');
    return;
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    const isNested = typeof value === 'object' && value !== null && !Array.isArray(value);
    const isArray = Array.isArray(value);

    if (isNested && !isArray) {
      lines.push(nestedIndent + key + ' {');
      stringifyObject(value, '', lines, indent, depth + 1);
      lines.push(nestedIndent + '}');
    } else if (isArray) {
      lines.push(nestedIndent + key + ' [');
      stringifyArray(value, '', lines, indent, depth + 1);
      lines.push(nestedIndent + ']');
    } else {
      lines.push(nestedIndent + key + ' = ' + formatValue(value));
    }
  }
}

function stringifyArray(
  arr: any[],
  prefix: string,
  lines: string[],
  indent: number,
  depth: number
): void {
  const nestedIndent = ' '.repeat(indent * depth);
  const nestedIndentItem = ' '.repeat(indent * (depth + 1));

  if (arr.length === 0) {
    lines.push(prefix + '[]');
    return;
  }

  const hasObjects = arr.some((item) => typeof item === 'object' && item !== null);

  if (hasObjects) {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const keys = Object.keys(item);
        if (keys.length > 0) {
          lines.push(nestedIndentItem + '{');
          stringifyObject(item, '', lines, indent, depth + 2);
          lines.push(nestedIndentItem + '}');
        }
      } else {
        lines.push(nestedIndentItem + formatValue(item));
      }
    }
  } else {
    const values = arr.map((item) => formatValue(item)).join(', ');
    lines.push(nestedIndent + '[' + values + ']');
  }
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'string') {
    if (value.startsWith('__ref__:')) {
      return '$' + value.slice(8);
    }
    if (needsQuoting(value)) {
      return '"' + escapeString(value) + '"';
    }
    return value;
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => formatValue(item)).join(', ') + ']';
  }
  return value.toString();
}

function needsQuoting(s: string): boolean {
  if (s.length === 0) return true;
  if (/^[\-\.]/.test(s)) return true;

  for (let i = 0; i < s.length; i++) {
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
      return true;
    }
  }

  const keywords = ['true', 'false', 'null'];
  if (keywords.includes(s)) return true;

  return false;
}

function escapeString(s: string): string {
  let result = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    switch (ch) {
      case '\n': result += '\\n'; break;
      case '\t': result += '\\t'; break;
      case '\\': result += '\\\\'; break;
      case '"': result += '\\"'; break;
      case "'": result += "\\'"; break;
      default: result += ch; break;
    }
  }
  return result;
}

export function dumps(obj: any, indent: number = 2): string {
  return stringify(obj, indent);
}
