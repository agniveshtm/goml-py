# Python Library

GOML parser and serializer for Python.

## Installation

```bash
pip install goml
```

## Quick Start

```python
import goml

# Parse GOML string
data = goml.loads("""
app {
  name = MyApp
  port = 8080
  features = [auth, logging]
}
""")

print(data["app"]["name"])  # MyApp
print(data["app"]["port"])  # 8080

# Parse from file
data = goml.load("config.goml")

# Serialize to GOML
output = goml.dumps(data)
print(output)

# Write to file
goml.dump(data, "output.goml")
```

## API Reference

### `loads(string) -> dict`

Parse a GOML string and return a Python dictionary.

```python
data = goml.loads("name = John\nage = 30")
# {"name": "John", "age": 30}
```

### `load(path) -> dict`

Parse a GOML file and return a Python dictionary.

```python
data = goml.load("config.goml")
```

### `dumps(data, indent="  ") -> str`

Serialize a Python object to a GOML string.

```python
output = goml.dumps({"name": "John", "age": 30})
# name = John
# age = 30
```

### `dump(data, path, indent="  ")`

Serialize a Python object and write to a GOML file.

```python
goml.dump(data, "output.goml")
```

## Type Mapping

| GOML | Python |
|------|--------|
| `string` | `str` |
| `integer` | `int` |
| `number` | `float` |
| `boolean` | `bool` |
| `null` | `None` |
| `array` | `list` |
| `object` | `dict` |

## CLI Usage

```bash
# Parse and print as JSON
python -m goml config.goml

# Pipe to other tools
python -m goml config.goml | jq '.app.name'
```

## Error Handling

```python
from goml import loads
from goml.errors import GomlError, ParseError, TokenError

try:
    data = loads("invalid = = =")
except ParseError as e:
    print(f"Parse error at line {e.line}, col {e.col}: {e}")
except GomlError as e:
    print(f"GOML error: {e}")
```

## Examples

```python
import goml

# Config with defaults
config = goml.loads("""
server {
  host = localhost
  port = 8080
}

database {
  host = localhost
  port = 5432
  name = myapp
}
""")

# Access nested values
host = config.get("server", {}).get("host", "0.0.0.0")
port = config.get("server", {}).get("port", 3000)

# Modify and serialize back
config["server"]["port"] = 9090
goml.dump(config, "updated.goml")
```
