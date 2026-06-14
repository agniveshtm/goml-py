# JavaScript/TypeScript Library

GOML parser and serializer for JavaScript and TypeScript.

## Installation

```bash
npm install @goml/parser
```

## Quick Start

```javascript
import { parse, stringify } from '@goml/parser';

// Parse GOML string
const data = parse(`
app {
  name = MyApp
  port = 8080
  features = [auth, logging]
}
`);

console.log(data.app.name);  // MyApp
console.log(data.app.port);  // 8080

// Serialize to GOML
const output = stringify(data);
console.log(output);
```

## API Reference

### `parse(input: string): any`

Parse a GOML string and return a JavaScript object.

```javascript
import { parse } from '@goml/parser';

const data = parse("name = John\nage = 30");
// { name: "John", age: 30 }
```

### `stringify(data: any, indent?: string): string`

Serialize a JavaScript object to a GOML string.

```javascript
import { stringify } from '@goml/parser';

const output = stringify({ name: "John", age: 30 });
// name = John
// age = 30
```

## TypeScript Types

```typescript
import { GomlValue, GomlObject, GomlArray } from '@goml/parser';

const data: GomlValue = parse(`
server {
  host = localhost
  port = 8080
}
`);

// Type-safe access
if (typeof data === 'object' && data !== null) {
  const server = data as GomlObject;
  console.log(server.server.host);
}
```

## Type Mapping

| GOML | JavaScript |
|------|------------|
| `string` | `string` |
| `integer` | `number` |
| `number` | `number` |
| `boolean` | `boolean` |
| `null` | `null` |
| `array` | `Array` |
| `object` | `Object` |

## CLI Usage

```bash
# Parse and print as JSON
npx goml parse config.goml

# Pipe to other tools
npx goml parse config.goml | jq '.app.name'
```

## Error Handling

```javascript
import { parse } from '@goml/parser';
import { GomlError, ParseError, TokenError } from '@goml/parser';

try {
  const data = parse("invalid = = =");
} catch (e) {
  if (e instanceof ParseError) {
    console.error(`Parse error at line ${e.line}, col ${e.col}: ${e.message}`);
  } else if (e instanceof GomlError) {
    console.error(`GOML error: ${e.message}`);
  }
}
```

## React Example

```jsx
import { useState, useEffect } from 'react';
import { parse } from '@goml/parser';

function ConfigLoader({ path }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch(path)
      .then(res => res.text())
      .then(text => setConfig(parse(text)));
  }, [path]);

  if (!config) return <div>Loading...</div>;

  return (
    <div>
      <h1>{config.app.name}</h1>
      <p>Port: {config.app.port}</p>
    </div>
  );
}
```

## Node.js Example

```javascript
const fs = require('fs');
const { parse, stringify } = require('@goml/parser');

// Read and parse
const data = parse(fs.readFileSync('config.goml', 'utf8'));

// Modify
data.server.port = 9090;

// Write back
fs.writeFileSync('config.goml', stringify(data));
```
