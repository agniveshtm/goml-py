# GOML Specification v1.1

**GOML** (Go Markup Language) - A simple data format with multiple syntax styles.

## Philosophy

- **Simple**: Minimal syntax rules
- **Flexible**: Multiple ways to write the same data
- **Readable**: Clean, uncluttered structure
- **Forgiving**: No strict indentation requirements
- **Safe**: No implicit type coercion surprises

## Syntax Styles

GOML supports **three syntax styles**. Choose what fits your use case:

### 1. Block Style (Original)
Best for: Nested configs, complex structures

```goml
server {
  host = localhost
  port = 8080
  
  ssl {
    enabled = true
    cert = /path/cert.pem
  }
}
```

### 2. Dot Notation (Simpler)
Best for: Flat configs, quick edits, simpler nesting

```goml
server.host = localhost
server.port = 8080
server.ssl.enabled = true
server.ssl.cert = /path/cert.pem
```

### 3. Flat Style (Simplest)
Best for: Simple key-value pairs, env files, .env alternatives

```goml
host = localhost
port = 8080
debug = false
database_url = postgres://localhost/myapp
```

## Mixing Styles

You can mix all three styles in the same file:

```goml
# Flat for simple values
name = MyApp
version = 1.0

# Dot notation for hierarchical values
server.host = localhost
server.port = 8080

# Block style for complex nested structures
database {
  primary {
    host = db-primary.internal
    port = 5432
  }
  replicas = [db-replica-1.internal, db-replica-2.internal]
}

# Arrays work in all styles
features = [auth, logging, cache]
```

## Core Syntax

### Key-Value Pairs

```
# All these work:
name = John                    # Simple
server.port = 8080            # Dot notation
server { port = 8080 }        # Block style
```

### Comments

```
# Hash comment
// Double slash comment
/* Multi-line comment */
```

### Strings

```
# Unquoted (no special chars)
name = John

# Double-quoted (escapes supported)
message = "Hello World"

# Single-quoted (no escapes)
literal = 'C:\Users\John'
```

### Numbers

```
count = 42
pi = 3.14159
negative = -100
```

### Booleans

```
enabled = true
disabled = false
```

### Null/Empty

```
value = null
data = ~
```

### Arrays

```
# Inline
colors = [red, green, blue]

# With objects
users [
  { name = Alice, email = alice@example.com }
  { name = Bob, email = bob@example.com }
]

# Trailing comma optional
numbers = [1, 2, 3,]
```

### Objects

```
# Block style
person {
  name = John
  age = 30
}

# Dot notation
person.name = John
person.age = 30
```

### References

```
defaults.timeout = 30
server.timeout = $defaults.timeout
```

### Quoted Strings

```
# Single line
message = "Hello World"

# With escape sequences
escaped = "Line one\nLine two"
tab = "Column1\tColumn2"
```

## Examples by Use Case

### Simple Config (Flat Style)
```goml
# .env alternative
app_name = MyApp
port = 8080
debug = false
database_url = postgres://localhost/myapp
redis_url = redis://localhost:6379
```

### Docker Compose (Dot Notation)
```goml
services.web.build = .
services.web.ports = [3000:3000]
services.web.depends_on = [api, db]
services.api.build = ./api
services.api.ports = [8080:8080]
services.db.image = postgres:15
services.db.ports = [5432:5432]
```

### Complex Config (Block Style)
```goml
app {
  name = MyApp
  version = 2.1.0
  
  server {
    host = 0.0.0.0
    port = 8080
    
    ssl {
      enabled = true
      cert = /etc/ssl/cert.pem
    }
  }
  
  database {
    host = localhost
    port = 5432
    pool {
      min = 5
      max = 20
    }
  }
}
```

### Mixed Styles
```goml
# Simple flat values
name = MyApp
version = 1.0

# Dot notation for partial nesting
server.host = localhost
server.port = 8080

# Block for complex nested structures
database {
  primary {
    host = db-primary.internal
    port = 5432
  }
  replicas = [db-replica-1.internal, db-replica-2.internal]
}
```

## File Extension

`.goml`

## MIME Type

`application/goml`

## Version History

- **v1.0** - Initial release with block style
- **v1.1** - Added dot notation and flat style
