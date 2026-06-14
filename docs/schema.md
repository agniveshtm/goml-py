# Schema Guide

GOML supports schema validation to ensure data integrity.

## Schema Syntax

```
type = object

required = [name, port]

properties {
  name {
    type = string
    minLength = 1
    maxLength = 100
  }

  port {
    type = integer
    minimum = 1
    maximum = 65535
  }

  debug {
    type = boolean
    default = false
  }

  environment {
    type = string
    enum = [development, staging, production]
  }
}
```

## Supported Types

| Type | Description |
|------|-------------|
| `string` | Text values |
| `integer` | Whole numbers |
| `number` | Integers and floats |
| `boolean` | true/false |
| `null` | Null value |
| `object` | Key-value map |
| `array` | List of items |

## Validation Rules

### String Rules
```
type = string
minLength = 1
maxLength = 255
pattern = ^[a-zA-Z]+$
enum = [option1, option2, option3]
```

### Number Rules
```
type = integer
minimum = 0
maximum = 100
```

### Array Rules
```
type = array
items {
  type = string
}
```

### Object Rules
```
type = object
required = [name, email]

properties {
  name {
    type = string
  }
  email {
    type = string
    pattern = ^.+@.+$
  }
}
```

## CLI Validation

```bash
# Validate against schema
goml validate -s schema.goml config.goml

# Validate multiple files
goml validate -s schema.goml *.goml
```

## Go API

```go
import "github.com/goml-lang/goml/internal/schema"

// Load and compile schema
s, _ := schema.Load("schema.goml")
s.Compile()

// Parse config
data, _ := goml.ParseFile("config.goml")

// Validate
errs := s.Validate(data)
if len(errs) > 0 {
    for _, e := range errs {
        fmt.Println(e)
    }
}
```

## Python API

```python
from goml import loads

# Parse
data = loads(open("config.goml").read())

# Manual validation
assert "name" in data
assert isinstance(data["port"], int)
```
