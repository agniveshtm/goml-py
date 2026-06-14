# GOML Documentation

Welcome to the GOML (Go Markup Language) documentation.

## Overview

GOML is a simple, human-readable data serialization format designed to fix the pain points of JSON, YAML, TOML, and XML.

## Key Features

- **Simple syntax** - Key-value with `=`
- **No indentation errors** - Use braces `{}` for nesting
- **Comments** - `#` and `//` styles
- **Clean arrays** - `[a, b, c]` with commas
- **Unquoted keys** - Readable and clean
- **Optional trailing commas** - No more syntax errors

## Quick Start

```
# Simple config
app {
  name = MyApp
  port = 8080
  features = [auth, logging]
}
```

## Documentation Structure

- [Specification](spec.md) - Formal language specification
- [Comparison](compare.md) - GOML vs other formats
- [CLI Reference](cli.md) - Command-line tool usage
- [Schema Guide](schema.md) - Data validation
- [Migration Guide](migration.md) - Converting from other formats
- [Python Library](python.md) - Python API reference
- [JavaScript Library](javascript.md) - JS/TS API reference

## Installation

### Go

```bash
go get github.com/goml-lang/goml/pkg/goml
```

### CLI

```bash
go install github.com/goml-lang/goml/cmd/goml@latest
```

### Python

```bash
pip install goml
```

### JavaScript

```bash
npm install @goml/parser
```

## Examples

See the `examples/` directory for complete examples:
- `config.goml` - Application configuration
- `package.goml` - Package manifest
- `data.goml` - Complex data structures
- `basic.goml` - Basic syntax
- `schema.goml` - Schema definition
