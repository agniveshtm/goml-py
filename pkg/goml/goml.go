package goml

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/goml-lang/goml/internal/ast"
	"github.com/goml-lang/goml/internal/parser"
)

func ParseBytes(data []byte) (interface{}, error) {
	return ParseString(string(data))
}

func ParseString(input string) (interface{}, error) {
	doc, err := parser.Parse(input)
	if err != nil {
		return nil, err
	}
	return nodeToInterface(doc), nil
}

func ParseFile(path string) (interface{}, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read file %s: %w", path, err)
	}
	return ParseBytes(data)
}

func Marshal(v interface{}, indent ...string) string {
	ind := "  "
	if len(indent) > 0 {
		ind = indent[0]
	}
	return marshalValue(v, 0, ind)
}

const maxMarshalDepth = 256

func marshalValue(v interface{}, depth int, indent string) string {
	if depth > maxMarshalDepth {
		return "...(depth limit exceeded)..."
	}
	prefix := strings.Repeat(indent, depth)

	switch val := v.(type) {
	case map[string]interface{}:
		if len(val) == 0 {
			return "{}"
		}
		var sb strings.Builder
		sb.WriteString("{\n")
		for _, key := range sortedKeys(val) {
			sb.WriteString(fmt.Sprintf("%s%s = %s\n", prefix+indent, key, marshalValue(val[key], depth+1, indent)))
		}
		sb.WriteString(prefix + "}")
		return sb.String()

	case []interface{}:
		if len(val) == 0 {
			return "[]"
		}
		if isSimpleArray(val) {
			return marshalSimpleArray(val)
		}
		var sb strings.Builder
		sb.WriteString("[\n")
		for _, item := range val {
			sb.WriteString(fmt.Sprintf("%s%s\n", prefix+indent, marshalValue(item, depth+1, indent)))
		}
		sb.WriteString(prefix + "]")
		return sb.String()

	case string:
		if needsQuoting(val) {
			return fmt.Sprintf("%q", val)
		}
		return val

	case int:
		return fmt.Sprintf("%d", val)

	case int64:
		return fmt.Sprintf("%d", val)

	case float64:
		return fmt.Sprintf("%g", val)

	case float32:
		return fmt.Sprintf("%g", val)

	case bool:
		if val {
			return "true"
		}
		return "false"

	case nil:
		return "null"

	default:
		return fmt.Sprintf("%v", val)
	}
}

func isSimpleArray(arr []interface{}) bool {
	for _, item := range arr {
		switch item.(type) {
		case string, int, int64, float64, float32, bool, nil:
			continue
		default:
			return false
		}
	}
	return true
}

func marshalSimpleArray(arr []interface{}) string {
	parts := make([]string, len(arr))
	for i, item := range arr {
		parts[i] = marshalValue(item, 0, "  ")
	}
	return "[" + strings.Join(parts, ", ") + "]"
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

func nodeToInterface(node ast.Node) interface{} {
	switch n := node.(type) {
	case *ast.Document:
		result := make(map[string]interface{})
		for _, stmt := range n.Statements {
			if kv, ok := stmt.(*ast.KeyValue); ok {
				val := nodeToInterface(kv.Value)
				if existing, exists := result[kv.Key]; exists {
					if existingMap, ok1 := existing.(map[string]interface{}); ok1 {
						if newMap, ok2 := val.(map[string]interface{}); ok2 {
							for k, v := range newMap {
								existingMap[k] = v
							}
							continue
						}
					}
				}
				result[kv.Key] = val
			}
		}
		return result

	case *ast.KeyValue:
		return nodeToInterface(n.Value)

	case *ast.Object:
		result := make(map[string]interface{})
		for _, entry := range n.Entries {
			if kv, ok := entry.(*ast.KeyValue); ok {
				result[kv.Key] = nodeToInterface(kv.Value)
			}
		}
		return result

	case *ast.Array:
		result := make([]interface{}, len(n.Items))
		for i, item := range n.Items {
			result[i] = nodeToInterface(item)
		}
		return result

	case *ast.StringVal:
		return n.Value

	case *ast.NumberVal:
		if n.IsFloat {
			return n.FloatVal
		}
		return n.IntVal

	case *ast.BoolVal:
		return n.Value

	case *ast.NullVal:
		return nil

	case *ast.Reference:
		return n.Path

	case *ast.Comment:
		return nil
	}

	return nil
}

func sortedKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
