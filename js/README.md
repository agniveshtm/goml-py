# @goml/parser

GOML (Go Markup Language) parser and serializer for JavaScript/TypeScript.

## Installation

```bash
npm install @goml/parser
```

## Usage

```typescript
import { parse, stringify, loads, dumps } from '@goml/parser';

// Parse GOML to JS object
const config = parse(`
  server {
    host = localhost
    port = 8080
  }
  database {
    name = mydb
    url = $server.host
  }
`);

// Convert JS object to GOML
const goml = stringify({
  server: {
    host: 'localhost',
    port: 8080
  }
});

// Shorthand functions
const data = loads('key = value');
const gomlString = dumps({ key: 'value' });
```

## GOML Format

```goml
# Comments start with #
key = value
key = "quoted string"
key = 42
key = 3.14
key = true
key = null
key = [1, 2, 3]
key = $reference.path

parent {
  child = value
  nested {
    deep = value
  }
}

items [
  {
    name = first
    value = 1
  }
]
```

## CLI

```bash
npx goml parse file.goml
npx goml stringify file.json
npx goml convert input.json output.goml
```

## License

MIT
