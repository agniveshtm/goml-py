# CLI Reference

## Usage

```
goml <command> [options] [file...]
```

## Commands

### fmt

Format GOML files in-place.

```bash
goml fmt config.goml
goml fmt *.goml
```

**Options:**
- None (formats in-place)

### lint

Check GOML files for issues.

```bash
goml lint config.goml
goml lint *.goml
```

**Checks:**
- Parse errors
- Duplicate keys
- Empty values
- Comment style warnings

**Exit codes:**
- 0: No errors (warnings OK)
- 1: Errors found

### validate

Validate GOML files against a schema.

```bash
goml validate -s schema.goml config.goml
goml validate -s schema.goml *.goml
```

**Options:**
- `-s, --schema` - Path to schema file (required)

### convert

Convert between GOML, JSON, YAML, and TOML.

```bash
# Convert JSON to GOML
goml convert -f json -t goml config.json

# Convert GOML to JSON
goml convert -f goml -t json config.goml

# Auto-detect input format
goml convert -t json config.goml
```

**Options:**
- `-f, --from` - Input format (json, yaml, toml, goml)
- `-t, --to` - Output format (json, yaml, toml, goml)

### pretty

Pretty print GOML files to stdout.

```bash
goml pretty config.goml
goml pretty *.goml
```

### version

Show version information.

```bash
goml version
```

### help

Show help message.

```bash
goml help
goml --help
goml -h
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (parse, validation, etc.) |

## Examples

```bash
# Format all GOML files in current directory
goml fmt *.goml

# Lint and show warnings
goml lint config.goml

# Validate against schema
goml validate -s schema.goml config.goml

# Convert to JSON
goml convert -t json config.goml > config.json

# Pretty print
goml pretty config.goml
```
