# GOML Backend Logic

How GOML works internally - from input string to output data.

## Overview

```
Input String → Lexer → Tokens → Parser → AST → NodeToInterface → Go Map/Slice
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        GOML Pipeline                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  "server.host = localhost"                                  │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │    Lexer    │  Tokenizes input into tokens               │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  [Ident("server.host"), Equals, Ident("localhost")]         │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │    Parser   │  Builds AST from tokens                    │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  KeyValue{Key: "server.host", Value: StringVal("localhost")}│
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  NodeToMap  │  Converts AST to Go native types           │
│  └─────────────┘                                            │
│         │                                                   │
│         ▼                                                   │
│  {"server": {"host": "localhost"}}                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Step 1: Lexer (Tokenizer)

**File:** `internal/lexer/lexer.go`

The lexer converts raw text into a stream of tokens.

### Input
```
server.host = localhost
```

### Output
```
[Ident("server.host"), Equals, Ident("localhost"), EOF]
```

### How It Works

1. Read characters one by one
2. Skip whitespace (spaces, tabs, newlines)
3. Identify token type based on first character:
   - `a-z`, `A-Z`, `_`, `-` → Identifier (may contain `.` for dot notation)
   - `0-9`, `-` → Number
   - `"` or `'` → String
   - `{` → LeftBrace
   - `}` → RightBrace
   - `=` → Equals
   - `#` → Comment (skip to end of line)
   - `//` → Comment (skip to end of line)
   - `$` → Dollar (start of reference)
   - `~` → Null
   - `true`/`false` → Boolean
   - `null` → Null

### Token Types

```go
type TokenType int

const (
    TokenEOF        // End of file
    TokenIdent      // Identifier (key names)
    TokenString     // Quoted string
    TokenNumber     // Integer or float
    TokenBoolean    // true or false
    TokenNull       // null or ~
    TokenLBrace     // {
    TokenRBrace     // }
    TokenLBracket   // [
    TokenRBracket   // ]
    TokenEquals     // =
    TokenComma      // ,
    TokenDot        // .
    TokenDollar     // $
    TokenComment    // # or // comment
)
```

### Safety Limits

```go
maxInputSize = 10 * 1024 * 1024  // 10MB max input
maxStringLen = 1024 * 1024        // 1MB max string
maxIdentLen  = 1024               // Max identifier length
maxNumberLen = 64                 // Max number digits
maxTokens    = 10 * 1000 * 1000  // 10M max tokens
```

---

## Step 2: Parser

**File:** `internal/parser/parser.go`

The parser converts tokens into an Abstract Syntax Tree (AST).

### Input
```
[Ident("server.host"), Equals, Ident("localhost"), EOF]
```

### Output
```
Document {
  Statements: [
    KeyValue {
      Key: "server"
      Value: Object {
        Entries: [
          KeyValue {
            Key: "host"
            Value: StringVal("localhost")
          }
        ]
      }
    }
  ]
}
```

### How It Works

1. Read tokens one by one
2. For each identifier:
   - If followed by `=` → Parse as key-value
   - If followed by `{` → Parse as object
   - If followed by `[` → Parse as array
   - If contains `.` → Expand to nested objects (dot notation)
3. For values:
   - String tokens → StringVal
   - Number tokens → NumberVal
   - Boolean tokens → BoolVal
   - Null tokens → NullVal
   - `{` → Object (recursive)
   - `[` → Array (recursive)
   - `$` → Reference

### Dot Notation Expansion

Input: `server.host = localhost`

The parser splits on `.` and creates nested objects:

```
KeyValue {
  Key: "server"
  Value: Object {
    Entries: [
      KeyValue {
        Key: "host"
        Value: StringVal("localhost")
      }
    ]
  }
}
```

### Nested Object Parsing

Input:
```
server {
  host = localhost
  port = 8080
}
```

Output:
```
KeyValue {
  Key: "server"
  Value: Object {
    Entries: [
      KeyValue { Key: "host", Value: StringVal("localhost") },
      KeyValue { Key: "port", Value: NumberVal(8080) }
    ]
  }
}
```

---

## Step 3: AST (Abstract Syntax Tree)

**File:** `internal/ast/ast.go`

The AST is a tree representation of the parsed data.

### Node Types

```go
type Node interface {
    nodeType() string
}

type Document struct {
    Statements []Node
    Line, Col  int
}

type KeyValue struct {
    Key   string
    Value Node
    Line, Col int
}

type Object struct {
    Entries []Node
    Line, Col int
}

type Array struct {
    Items []Node
    Line, Col int
}

type StringVal struct {
    Value string
    Line, Col int
}

type NumberVal struct {
    Value    string
    IsFloat  bool
    FloatVal float64
    IntVal   int
    Line, Col int
}

type BoolVal struct {
    Value bool
    Line, Col int
}

type NullVal struct {
    Line, Col int
}

type Reference struct {
    Path string
    Line, Col int
}

type Comment struct {
    Text string
    Line, Col int
}
```

---

## Step 4: NodeToInterface (AST to Go Types)

**File:** `pkg/goml/goml.go`

This converts AST nodes to native Go types.

### Conversion Rules

| AST Node | Go Type |
|----------|---------|
| `Document` | `map[string]interface{}` |
| `KeyValue` | Entry in parent map |
| `Object` | `map[string]interface{}` |
| `Array` | `[]interface{}` |
| `StringVal` | `string` |
| `NumberVal` (int) | `int` |
| `NumberVal` (float) | `float64` |
| `BoolVal` | `bool` |
| `NullVal` | `nil` |
| `Reference` | `string` (path only, not resolved) |

### Dot Notation Merging

When multiple dot-notation entries share a prefix, they are merged:

```goml
server.host = localhost
server.port = 8080
```

Both entries create `server` objects. The merger combines them:

```go
result["server"] = map[string]interface{}{
    "host": "localhost",
    "port": 8080,
}
```

### Merge Algorithm

```go
for each KeyValue in Document:
    val = nodeToInterface(kv.Value)
    if existing, exists := result[kv.Key]:
        if existing is map AND val is map:
            merge val into existing
        else:
            result[kv.Key] = val  // overwrite
    else:
        result[kv.Key] = val
```

---

## Step 5: Marshal (Go Types to GOML)

**File:** `pkg/goml/goml.go`

The `Marshal()` function converts Go values back to GOML text.

### Conversion Rules

| Go Type | GOML Output |
|---------|-------------|
| `map[string]interface{}` | `key = value` blocks |
| `[]interface{}` (simple) | `[a, b, c]` inline |
| `[]interface{}` (complex) | Multiline array |
| `string` | `value` or `"value"` |
| `int` | `42` |
| `float64` | `3.14` |
| `bool` | `true` / `false` |
| `nil` | `null` |

### Smart Quoting

Strings are quoted only when necessary:

```go
needsQuoting(s) = true if:
    - Empty string
    - Contains space, tab, newline
    - Contains `,`, `=`, `{`, `}`, `[`, `]`, `#`, `"`, `'`
    - Equals "true", "false", "null"
    - Starts with digit
    - Equals "~"
    - Has leading/trailing whitespace
```

---

## Complete Example

### Input GOML
```goml
server {
  host = localhost
  port = 8080
}

features = [auth, logging]
```

### Lexer Output
```
[Ident("server"), LBrace, Ident("host"), Equals, Ident("localhost"),
 Ident("port"), Equals, Number("8080"), RBrace, Ident("features"),
 Equals, LBracket, Ident("auth"), Comma, Ident("logging"), RBracket, EOF]
```

### Parser Output (AST)
```
Document {
  Statements: [
    KeyValue {
      Key: "server"
      Value: Object {
        Entries: [
          KeyValue { Key: "host", Value: StringVal("localhost") },
          KeyValue { Key: "port", Value: NumberVal(8080) }
        ]
      }
    },
    KeyValue {
      Key: "features"
      Value: Array {
        Items: [StringVal("auth"), StringVal("logging")]
      }
    }
  ]
}
```

### NodeToInterface Output
```go
map[string]interface{}{
    "server": map[string]interface{}{
        "host": "localhost",
        "port": 8080,
    },
    "features": []interface{}{"auth", "logging"},
}
```

### Marshal Output
```goml
server {
  host = localhost
  port = 8080
}

features = [auth, logging]
```

---

## Error Handling

### Lexer Errors
- Unterminated string → Error with line/col
- Too many tokens → Error with limit
- Input too large → Truncated to max

### Parser Errors
- Missing closing brace → Error with line
- Missing closing bracket → Error with line
- Unexpected token → Error with line/col
- Max nesting depth exceeded → Error

### Validation Errors
- Type mismatch → Error with path
- Missing required field → Error with path
- Value out of range → Error with path

---

## Performance Characteristics

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Lexing | O(n) | O(n) tokens |
| Parsing | O(n) | O(n) AST nodes |
| NodeToInterface | O(n) | O(n) Go objects |
| Marshal | O(n) | O(n) output chars |

Where n = input size (characters)

---

## Security Considerations

### Input Limits
- Max input: 10MB
- Max string: 1MB
- Max tokens: 10M
- Max nesting: 256 levels
- Max schema depth: 32 levels

### Safe Against
- Stack overflow (depth limits)
- Memory exhaustion (size limits)
- ReDoS (no regex in parser)
- Injection (no code execution)

### Known Limitations
- References not resolved (potential info leak if paths exposed)
- No schema enforcement on output
- Comments stripped during parse (no round-trip fidelity)
