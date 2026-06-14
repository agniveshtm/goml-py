# Migration Guide

How to convert from JSON, YAML, TOML, and XML to GOML.

## JSON to GOML

### JSON
```json
{
  "name": "MyApp",
  "port": 8080,
  "debug": false,
  "features": ["auth", "logging"],
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
```

### GOML
```
name = MyApp
port = 8080
debug = false
features = [auth, logging]

database {
  host = localhost
  port = 5432
}
```

### Rules
| JSON | GOML |
|------|------|
| `"key": value` | `key = value` |
| `{}` objects | `{}` blocks |
| `[]` arrays | `[a, b, c]` |
| `"strings"` | `unquoted` or `"quoted"` |
| `null` | `null` |
| No comments | `# comment` |

## YAML to GOML

### YAML
```yaml
name: MyApp
port: 8080
debug: false
features:
  - auth
  - logging
database:
  host: localhost
  port: 5432
```

### GOML
```
name = MyApp
port = 8080
debug = false
features = [auth, logging]

database {
  host = localhost
  port = 5432
}
```

### Rules
| YAML | GOML |
|------|------|
| `key: value` | `key = value` |
| Indentation | `{}` blocks |
| `- item` | `[item, item]` |
| Comments `#` | Comments `#` |
| `null` | `null` or `~` |

## TOML to GOML

### TOML
```toml
name = "MyApp"
port = 8080
debug = false
features = ["auth", "logging"]

[database]
host = "localhost"
port = 5432
```

### GOML
```
name = MyApp
port = 8080
debug = false
features = [auth, logging]

database {
  host = localhost
  port = 5432
}
```

### Rules
| TOML | GOML |
|------|------|
| `key = "value"` | `key = value` |
| `[section]` | `key { }` |
| `[[array]]` | `key [ ]` |
| `# comment` | `# comment` |
| `"strings"` | `unquoted` or `"quoted"` |

## XML to GOML

### XML
```xml
<app>
  <name>MyApp</name>
  <port>8080</port>
  <debug>false</debug>
</app>
```

### GOML
```
app {
  name = MyApp
  port = 8080
  debug = false
}
```

### Rules
| XML | GOML |
|-----|------|
| `<tag>value</tag>` | `tag = value` |
| `<parent>...</parent>` | `parent { }` |
| Attributes | Nested keys |
| `<!-- comment -->` | `# comment` |

## Automated Conversion

Use the CLI tool:

```bash
# JSON to GOML
goml convert -f json -t goml config.json

# YAML to GOML
goml convert -f yaml -t goml config.yaml

# TOML to GOML
goml convert -f toml -t goml config.toml

# XML to GOML (limited)
goml convert -f xml -t goml config.xml
```

## Common Gotchas

1. **Quoted vs Unquoted**: Use quotes for strings with spaces or special chars
2. **Trailing Commas**: Optional in GOML, required in JSON
3. **Boolean Values**: `true`/`false` only, no `True`/`FALSE`
4. **Null Values**: `null` or `~`, not `None` or `nil`
5. **Keys**: Unquoted by default, quotes needed for special characters
