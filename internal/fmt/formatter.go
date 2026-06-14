package fmt

import (
	"fmt"
	"os"
	"strings"

	"github.com/goml-lang/goml/internal/parser"
	"github.com/goml-lang/goml/internal/ast"
)

type Formatter struct {
	indent string
}

func New() *Formatter {
	return &Formatter{indent: "  "}
}

func (f *Formatter) SetIndent(indent string) {
	f.indent = indent
}

func (f *Formatter) Format(input string) (string, error) {
	doc, err := parser.Parse(input)
	if err != nil {
		return "", fmt.Errorf("parse error: %w", err)
	}
	return f.formatDocument(doc), nil
}

func (f *Formatter) FormatFile(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	result, err := f.Format(string(data))
	if err != nil {
		return err
	}
	return os.WriteFile(path, []byte(result), 0644)
}

func (f *Formatter) formatDocument(doc *ast.Document) string {
	var sb strings.Builder
	for i, stmt := range doc.Statements {
		if i > 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(f.formatNode(stmt, 0))
	}
	sb.WriteString("\n")
	return sb.String()
}

func (f *Formatter) formatNode(node ast.Node, depth int) string {
	prefix := strings.Repeat(f.indent, depth)

	switch n := node.(type) {
	case *ast.Comment:
		return prefix + "# " + strings.TrimSpace(strings.TrimPrefix(n.Text, "#"))

	case *ast.KeyValue:
		return fmt.Sprintf("%s%s = %s", prefix, n.Key, f.formatNode(n.Value, depth))

	case *ast.Object:
		return f.formatObject(n, depth)

	case *ast.Array:
		return f.formatArray(n, depth)

	case *ast.StringVal:
		if needsQuoting(n.Value) {
			return fmt.Sprintf("%q", n.Value)
		}
		return n.Value

	case *ast.NumberVal:
		return n.Value

	case *ast.BoolVal:
		if n.Value {
			return "true"
		}
		return "false"

	case *ast.NullVal:
		return "null"

	case *ast.Reference:
		return "$" + n.Path

	default:
		return "???"
	}
}

func (f *Formatter) formatObject(obj *ast.Object, depth int) string {
	if len(obj.Entries) == 0 {
		return "{}"
	}

	prefix := strings.Repeat(f.indent, depth)
	var sb strings.Builder
	sb.WriteString("{\n")

	for i, entry := range obj.Entries {
		if i > 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(f.formatNode(entry, depth+1))
		sb.WriteString("\n")
	}

	sb.WriteString(prefix + "}")
	return sb.String()
}

func (f *Formatter) formatArray(arr *ast.Array, depth int) string {
	if len(arr.Items) == 0 {
		return "[]"
	}

	simple := true
	for _, item := range arr.Items {
		if _, ok := item.(*ast.Object); ok {
			simple = false
			break
		}
		if _, ok := item.(*ast.Array); ok {
			simple = false
			break
		}
	}

	if simple {
		parts := make([]string, len(arr.Items))
		for i, item := range arr.Items {
			parts[i] = f.formatNode(item, 0)
		}
		return "[" + strings.Join(parts, ", ") + "]"
	}

	prefix := strings.Repeat(f.indent, depth)
	var sb strings.Builder
	sb.WriteString("[\n")

	for i, item := range arr.Items {
		if i > 0 {
			sb.WriteString("\n")
		}
		sb.WriteString(strings.Repeat(f.indent, depth+1) + f.formatNode(item, depth+1))
	}

	sb.WriteString("\n" + prefix + "]")
	return sb.String()
}

func needsQuoting(s string) bool {
	if len(s) == 0 {
		return true
	}
	for _, r := range s {
		if r == ' ' || r == '\t' || r == '\n' || r == ',' || r == '=' || r == '{' || r == '}' || r == '[' || r == ']' || r == '#' || r == '"' || r == '\'' {
			return true
		}
	}
	trimmed := strings.TrimSpace(s)
	if trimmed != s {
		return true
	}
	if trimmed == "true" || trimmed == "false" || trimmed == "null" {
		return true
	}
	if len(trimmed) > 0 && trimmed[0] >= '0' && trimmed[0] <= '9' {
		return true
	}
	if trimmed == "~" {
		return true
	}
	return false
}
