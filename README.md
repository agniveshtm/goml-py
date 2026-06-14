# GOML - Go Markup Language

A simple, human-readable data format with **three syntax styles** for different use cases.

## Why GOML?

| Problem | GOML Solution |
|---------|---------------|
| JSON has no comments | `#` and `//` comments work |
| YAML indentation errors | Use braces `{}` or dots `.` |
| JSON quoted keys | Unquoted keys everywhere |
| XML verbose syntax | Clean, minimal syntax |
| TOML complex nesting | Simple `{}` or `.` notation |
| Trailing comma errors | Optional commas |

## Quick Start

```goml
# Simple flat config
app_name = MyApp
port = 8080
debug = false

# Or use dot notation
server.host = localhost
server.port = 8080

# Or use block style
server {
  host = localhost
  port = 8080
}
```

---

# The Three Syntax Styles

GOML supports **three different ways** to write the same data. Choose the style that fits your use case.

## 1. Flat Style (Simplest)

**Best for:** Simple configs, `.env` files, quick scripts, environment variables

### Syntax
```goml
key = value
```

### Examples

**Simple config:**
```goml
app_name = MyApp
version = 1.0
port = 8080
debug = false
database_url = postgres://localhost/myapp
redis_url = redis://localhost:6379
```

**Environment variables (`.env` alternative):**
```goml
# Database
DB_HOST = localhost
DB_PORT = 5432
DB_NAME = myapp
DB_USER = admin
DB_PASS = secret

# API
API_KEY = abc123
API_SECRET = xyz789

# Server
PORT = 8080
HOST = 0.0.0.0
```

**Feature flags:**
```goml
dark_mode = true
beta_features = false
new_checkout = true
analytics = true
maintenance = false
```

**Package.json alternative:**
```goml
name = my-project
version = 1.0.0
description = A cool project
main = index.js
license = MIT
```

### When to Use Flat Style

| Use Case | Why Flat Works |
|----------|----------------|
| `.env` files | Simple key-value pairs |
| CLI arguments | Quick configuration |
| Feature flags | Easy to toggle on/off |
| Simple settings | No nesting needed |
| Quick scripts | Minimal syntax |

### When NOT to Use Flat Style

| Use Case | Why Not |
|----------|---------|
| Nested config | Can't represent hierarchy |
| Complex data | No arrays or objects |
| Grouped settings | No way to group related items |

---

## 2. Dot Notation (Simpler)

**Best for:** Partial nesting, Docker Compose, Kubernetes, quick edits, CI/CD configs

### Syntax
```goml
parent.child = value
parent.child.grandchild = value
```

### Examples

**Docker Compose:**
```goml
services.web.build = .
services.web.ports = [3000:3000]
services.web.depends_on = [api, db]
services.web.environment.NODE_ENV = production

services.api.build = ./api
services.api.ports = [8080:8080]
services.api.depends_on = [db, redis]

services.db.image = postgres:15
services.db.ports = [5432:5432]
services.db.environment.POSTGRES_DB = myapp

services.redis.image = redis:7-alpine
services.redis.ports = [6379:6379]
```

**Kubernetes deployment:**
```goml
metadata.name = api-server
metadata.namespace = production
metadata.labels.app = api

spec.replicas = 3
spec.template.spec.containers.name = api
spec.template.spec.containers.image = ghcr.io/org/api:latest
spec.template.spec.containers.ports.containerPort = 8080
spec.template.spec.containers.resources.requests.cpu = 100m
spec.template.spec.containers.resources.requests.memory = 128Mi
```

**GitHub Actions:**
```goml
pipeline.name = CI/CD Pipeline
pipeline.on.push = [main, develop]
pipeline.on.pull_request = [main]

pipeline.jobs.test.runs_on = ubuntu-latest
pipeline.jobs.test.steps = [checkout, setup-go, test]

pipeline.jobs.build.runs_on = ubuntu-latest
pipeline.jobs.build.needs = [test]
pipeline.jobs.build.strategy.matrix.goos = [linux, darwin, windows]
```

**App config with partial nesting:**
```goml
app.name = MyApp
app.version = 2.1.0

server.host = 0.0.0.0
server.port = 8080
server.ssl.enabled = true
server.ssl.cert = /etc/ssl/cert.pem

database.host = db.example.com
database.port = 5432
database.name = myapp
database.pool.min = 5
database.pool.max = 20
```

**Nginx config:**
```goml
http.upstream.backend.server = 127.0.0.1:8080
http.server.listen = 80
http.server.server_name = example.com
http.server.location./.proxy_pass = http://backend
http.server.location./static.expires = 30d
```

### When to Use Dot Notation

| Use Case | Why Dots Work |
|----------|---------------|
| Docker Compose | Clean service definitions |
| Kubernetes | Less verbose than YAML |
| CI/CD pipelines | Clear step hierarchy |
| Partial nesting | Some flat, some nested |
| Quick edits | Faster than braces |

### When NOT to Use Dot Notation

| Use Case | Why Not |
|----------|---------|
| Deep nesting | Lines get very long |
| Complex objects | Hard to see structure |
| Arrays of objects | Awkward syntax |

---

## 3. Block Style (Original)

**Best for:** Complex configs, nested structures, maximum clarity, documentation

### Syntax
```goml
key {
  child = value
  nested {
    grandchild = value
  }
}
```

### Examples

**Complex app config:**
```goml
app {
  name = MyApp
  version = 2.1.0
  debug = false
}

server {
  host = 0.0.0.0
  port = 8080
  workers = 4
  timeout = 30

  ssl {
    enabled = true
    cert = /etc/ssl/certs/app.pem
    key = /etc/ssl/private/app.key
  }
}

database {
  driver = postgres
  host = db.example.com
  port = 5432
  name = myapp_production

  pool {
    min = 5
    max = 20
    idle_timeout = 300
  }

  credentials {
    user = app_user
    pass = ${DB_PASSWORD}
  }
}

features {
  dark_mode = true
  beta_features = false
  analytics = true
}

logging {
  level = info
  output = [stdout, /var/log/app.log]
  format = json

  rotate {
    enabled = true
    max_size = 100MB
    max_files = 5
  }
}
```

**Package manifest:**
```goml
name = github.com/user/myproject
version = 1.0.0
description = A sample Go project
license = MIT

author {
  name = John Doe
  email = john@example.com
}

dependencies {
  gin = v1.9.1
  pgx = v5.4.3
  zap = v1.26.0
}

build {
  main = ./cmd/server
  output = ./bin/server
}

scripts {
  test = go test ./...
  build = go build -o bin/server ./cmd/server
}
```

**Data with arrays of objects:**
```goml
users [
  {
    name = Alice
    email = alice@example.com
    role = admin
    permissions = [read, write, delete]
  }
  {
    name = Bob
    email = bob@example.com
    role = user
    permissions = [read, write]
  }
  {
    name = Charlie
    email = charlie@example.com
    role = viewer
    permissions = [read]
  }
]

products {
  electronics {
    laptop {
      name = MacBook Pro
      price = 1999.99
      specs {
        cpu = M3 Pro
        ram = 18GB
        storage = 512GB SSD
      }
    }
    phone {
      name = iPhone 15
      price = 999.00
      colors = [black, white, blue]
    }
  }
}
```

**Feature flags with detailed config:**
```goml
features {
  dark_mode {
    enabled = true
    rollout = 100
    description = "Enable dark mode for all users"
  }

  new_checkout {
    enabled = true
    rollout = 25
    variants {
      control { weight = 50 }
      variant_a { weight = 30 }
      variant_b { weight = 20 }
    }
    segments {
      beta_users = 100
      premium_users = 50
    }
  }

  ai_search {
    enabled = false
    rollout = 0
    allowed_users = [admin, beta-tester]
  }
}
```

### When to Use Block Style

| Use Case | Why Blocks Work |
|----------|-----------------|
| Complex config | Clear structure |
| Nested objects | Easy to read |
| Arrays of objects | Clean syntax |
| Documentation | Self-documenting |
| Maximum clarity | No ambiguity |

### When NOT to Use Block Style

| Use Case | Why Not |
|----------|---------|
| Simple config | Overkill |
| Quick edits | More typing |
| Partial nesting | Awkward mix |

---

# Mixing Styles

You can **mix all three styles** in the same file:

```goml
# Flat for simple values
name = MyApp
version = 1.0
debug = false

# Dot notation for partial nesting
server.host = localhost
server.port = 8080
database.host = db.internal
database.port = 5432

# Block for complex nested structures
features {
  dark_mode = true
  beta_features = false
  analytics = true
}

# Arrays work in all styles
colors = [red, green, blue]

# Array of objects (block style)
users [
  { name = Alice, role = admin }
  { name = Bob, role = user }
]
```

**Output (same JSON regardless of style):**
```json
{
  "name": "MyApp",
  "version": 1.0,
  "debug": false,
  "server": { "host": "localhost", "port": 8080 },
  "database": { "host": "db.internal", "port": 5432 },
  "features": { "dark_mode": true, "beta_features": false, "analytics": true },
  "colors": ["red", "green", "blue"],
  "users": [
    { "name": "Alice", "role": "admin" },
    { "name": "Bob", "role": "user" }
  ]
}
```

---

# Style Comparison

| Feature | Flat | Dot Notation | Block |
|---------|------|--------------|-------|
| Syntax | `key = val` | `a.b.c = val` | `a { b { c = val } }` |
| Nesting | None | Partial | Full |
| Readability | Simplest | Clean | Clearest |
| Typing speed | Fastest | Fast | Medium |
| Best depth | 0 levels | 1-2 levels | Any level |
| Use case | .env | Docker/K8s | Complex config |

---

# When to Use Each Style

## Use FLAT when:
- Writing `.env` files
- Simple key-value config
- Feature flags
- CLI arguments
- Quick scripts

## Use DOT NOTATION when:
- Docker Compose configs
- Kubernetes manifests
- CI/CD pipelines (GitHub Actions)
- Partial nesting needed
- Quick hierarchical edits

## Use BLOCK when:
- Complex nested configs
- Package manifests
- Data with arrays of objects
- Maximum clarity needed
- Documentation with structure

## Use MIXED when:
- Different parts need different styles
- Transitioning from one style to another
- Team has mixed preferences

---

# Real-World Examples by Style

## Flat Style Examples

### 1. Environment Variables
```goml
# .env.goml
DATABASE_URL = postgres://localhost/myapp
REDIS_URL = redis://localhost:6379
API_KEY = abc123
SECRET_KEY = xyz789
PORT = 8080
HOST = 0.0.0.0
```

### 2. Feature Flags
```goml
# features.goml
dark_mode = true
beta_features = false
new_checkout = true
analytics = true
maintenance = false
notifications = true
```

### 3. Simple Settings
```goml
# settings.goml
theme = dark
language = en
timezone = UTC
auto_save = true
spell_check = false
```

## Dot Notation Examples

### 1. Docker Compose
```goml
# docker-compose.goml
services.web.build = .
services.web.ports = [3000:3000]
services.web.depends_on = [api, db]

services.api.build = ./api
services.api.ports = [8080:8080]

services.db.image = postgres:15
services.db.ports = [5432:5432]
```

### 2. GitHub Actions
```goml
# ci.goml
pipeline.name = CI/CD
pipeline.on.push = [main, develop]

pipeline.jobs.test.runs_on = ubuntu-latest
pipeline.jobs.test.steps = [checkout, test, lint]

pipeline.jobs.deploy.runs_on = ubuntu-latest
pipeline.jobs.deploy.needs = [test]
```

### 3. Kubernetes
```goml
# deployment.goml
metadata.name = api-server
metadata.namespace = production
spec.replicas = 3
spec.template.spec.containers.image = ghcr.io/org/api:latest
```

## Block Style Examples

### 1. Application Config
```goml
# config.goml
app {
  name = MyApp
  version = 2.1.0
}

server {
  host = 0.0.0.0
  port = 8080
  
  ssl {
    enabled = true
    cert = /path/cert.pem
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
```

### 2. Package Manifest
```goml
# package.goml
name = my-project
version = 1.0.0

author {
  name = John Doe
  email = john@example.com
}

dependencies {
  react = 18.2.0
  next = 14.0.0
}
```

### 3. Data Store
```goml
# data.goml
users [
  { name = Alice, email = alice@example.com }
  { name = Bob, email = bob@example.com }
]

products {
  laptop { name = MacBook, price = 1999 }
  phone { name = iPhone, price = 999 }
}
```

---

# Installation

## Go
```bash
go get github.com/goml-lang/goml/pkg/goml
```

## CLI
```bash
go install github.com/goml-lang/goml/cmd/goml@latest
```

## Python
```bash
pip install goml
```

## JavaScript
```bash
npm install @goml/parser
```

---

# CLI Tools

```bash
# Format files
goml fmt config.goml

# Lint for issues
goml lint config.goml

# Validate against schema
goml validate -s schema.goml config.goml

# Convert between formats
goml convert -f json -t goml config.json

# Pretty print
goml pretty config.goml
```

---

# Documentation

- [Specification](specs/grammar.ebnf) - Formal grammar
- [Spec v1.1](specs/spec.md) - Full specification with examples
- [CLI Reference](docs/cli.md) - Tool usage
- [Migration Guide](docs/migration.md) - Convert from other formats
- [Schema Guide](docs/schema.md) - Data validation
- [Use Cases](usecase/README.md) - Real-world examples
- [Python API](docs/python.md) - Python library
- [JavaScript API](docs/javascript.md) - JS/TS library
- [Governance](docs/governance.md) - Project governance

---

# Live Demo

- [Budget Tracker](examples/budget-tracker/) - Web app using GOML as data store
- [Website](website/) - GOML marketing site with playground

---
