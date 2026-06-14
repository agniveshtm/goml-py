# Contributing to GOML

Thank you for your interest in contributing to GOML!

## Ways to Contribute

1. **Report Bugs** - Open an issue with reproduction steps
2. **Suggest Features** - Open an issue with your idea
3. **Write Code** - Submit a pull request
4. **Improve Docs** - Fix typos, add examples
5. **Build Tools** - Create parsers, linters, editors for other languages

## Development Setup

### Prerequisites

- Go 1.21+
- Python 3.8+
- Node.js 18+

### Clone and Build

```bash
# Clone the repo
git clone https://github.com/goml-lang/goml.git
cd goml

# Build Go tools
go build ./cmd/goml

# Run tests
go test ./...

# Build Python library
cd python && pip install -e .

# Build JS library
cd js && npm install && npm run build
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`go test ./...`)
6. Update documentation if needed
7. Submit a pull request

## Code Style

### Go

- Follow standard Go conventions
- Use `gofmt` and `goimports`
- Write tests for all public functions

### Python

- Follow PEP 8
- Use type hints
- Write docstrings for all public functions

### JavaScript/TypeScript

- Follow ESLint rules
- Use TypeScript for all new code
- Write JSDoc comments

## Testing

### Unit Tests

```bash
# Go
go test ./...

# Python
cd python && pytest

# JavaScript
cd js && npm test
```

### Integration Tests

```bash
# Test CLI
./goml fmt examples/*.goml
./goml lint examples/*.goml
./goml validate -s examples/schema.goml examples/config.goml
```

## Reporting Issues

When reporting bugs, please include:

1. GOML version
2. Operating system
3. Steps to reproduce
4. Expected behavior
5. Actual behavior
6. Sample GOML file (if applicable)

## Feature Requests

When suggesting features, please include:

1. Use case (why do you need this?)
2. Example syntax
3. How it differs from existing formats
4. Any compatibility concerns

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
