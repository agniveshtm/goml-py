# GOML Use Cases - Real World Examples

## Docker Compose

### Before (YAML)
```yaml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - api
      - db
    environment:
      NODE_ENV: production
      API_URL: http://api:8080

  api:
    build: ./api
    ports:
      - "8080:8080"
    depends_on:
      - db
      - redis
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/myapp
      REDIS_URL: redis://redis:6379

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### After (GOML)
```goml
services {
  web {
    build = .
    ports = [3000:3000]
    depends_on = [api, db]
    environment {
      NODE_ENV = production
      API_URL = http://api:8080
    }
  }

  api {
    build = ./api
    ports = [8080:8080]
    depends_on = [db, redis]
    environment {
      DATABASE_URL = postgres://user:pass@db:5432/myapp
      REDIS_URL = redis://redis:6379
    }
  }

  db {
    image = postgres:15-alpine
    environment {
      POSTGRES_DB = myapp
      POSTGRES_USER = user
      POSTGRES_PASSWORD = pass
    }
    volumes = [pgdata:/var/lib/postgresql/data]
  }

  redis {
    image = redis:7-alpine
    ports = [6379:6379]
  }
}

volumes {
  pgdata
}
```

| Aspect | YAML | GOML |
|--------|------|------|
| Lines | 45 | 35 |
| Colons | Many | None |
| Indentation errors | Yes | No |
| Comments | Limited | Full support |
| Readability | Good | Better |

---

## GitHub Actions

### Before (YAML)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: '1.21'
      - run: go test ./... -v

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        goos: [linux, darwin, windows]
        goarch: [amd64, arm64]
    steps:
      - uses: actions/checkout@v4
      - run: go build -o dist/${{matrix.goos}}-${{matrix.goarch}} ./cmd/goml
```

### After (GOML)
```goml
pipeline {
  name = CI/CD Pipeline
  
  on {
    push = [main, develop]
    pull_request = [main]
  }

  jobs {
    test {
      name = Run Tests
      runs_on = ubuntu-latest
      steps [
        { uses = actions/checkout@v4 }
        { uses = actions/setup-go@v5 with { go_version = "1.21" } }
        { run = "go test ./... -v" }
      ]
    }

    build {
      name = Build
      runs_on = ubuntu-latest
      needs = [test]
      strategy {
        matrix {
          goos = [linux, darwin, windows]
          goarch = [amd64, arm64]
        }
      }
      steps [
        { uses = actions/checkout@v4 }
        { run = "go build -o dist/${{matrix.goos}}-${{matrix.goarch}} ./cmd/goml" }
      ]
    }
  }
}
```

| Aspect | YAML | GOML |
|--------|------|------|
| Lines | 35 | 30 |
| Nested depth | Deep | Shallow |
| Readability | Medium | High |
| Comments | Yes | Yes |

---

## Kubernetes

### Before (YAML)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
  labels:
    app: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: ghcr.io/myorg/api:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
```

### After (GOML)
```goml
deployment {
  apiVersion = apps/v1
  kind = Deployment
  
  metadata {
    name = api-server
    namespace = production
    labels { app = api }
  }
  
  spec {
    replicas = 3
    selector { match_labels { app = api } }
    
    template {
      metadata { labels { app = api } }
      
      spec {
        containers [{
          name = api
          image = ghcr.io/myorg/api:latest
          ports = [{ container_port = 8080 }]
          
          resources {
            requests { cpu = 100m, memory = 128Mi }
            limits { cpu = 500m, memory = 512Mi }
          }
        }]
      }
    }
  }
}
```

| Aspect | YAML | GOML |
|--------|------|------|
| Lines | 30 | 25 |
| Closing tags | None | Explicit braces |
| Ambiguity | High | Low |
| Self-documenting | No | Yes |

---

## When to Use GOML for DevOps

| Use Case | GOML | YAML | Winner |
|----------|------|------|--------|
| Docker Compose | ✅ | ✅ | GOML |
| GitHub Actions | ✅ | ✅ | GOML |
| Kubernetes | ✅ | ✅ | GOML |
| Ansible | ✅ | ✅ | Tie |
| Terraform | ✅ | ✅ | Tie |

## Benefits

1. **No indentation errors** - Braces `{}` are explicit
2. **Comments work** - `#` everywhere
3. **Cleaner syntax** - `=` instead of `:`
4. **Less verbose** - No closing tags
5. **Self-documenting** - Structure is always clear
