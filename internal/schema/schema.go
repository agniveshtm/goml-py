package schema

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/Aswanidev-vs/goml/internal/ast"
	"github.com/Aswanidev-vs/goml/internal/parser"
)

type Schema struct {
	Type        string
	Required    []string
	Properties  map[string]*Schema
	Items       *Schema
	Minimum     *float64
	Maximum     *float64
	MinLength   *int
	MaxLength   *int
	Pattern     string
	Enum        []interface{}
	Default     interface{}
	Description string
	compiled    *regexp.Regexp
}

const maxSchemaDepth = 32

func Load(path string) (*Schema, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read schema: %w", err)
	}
	if len(data) > 1024*1024 {
		return nil, fmt.Errorf("schema file too large (max 1MB)")
	}
	return ParseSchema(string(data))
}

func ParseSchema(input string) (*Schema, error) {
	doc, err := parser.Parse(input)
	if err != nil {
		return nil, fmt.Errorf("parse schema: %w", err)
	}

	schema := &Schema{
		Properties: make(map[string]*Schema),
	}

	for _, stmt := range doc.Statements {
		if kv, ok := stmt.(*ast.KeyValue); ok {
			schema.setProperty(kv.Key, kv.Value, 0)
		}
	}

	return schema, nil
}

func (s *Schema) setProperty(key string, value ast.Node, depth int) {
	if depth > maxSchemaDepth {
		return
	}

	switch key {
	case "type":
		if sv, ok := value.(*ast.StringVal); ok {
			s.Type = sv.Value
		}
	case "required":
		if arr, ok := value.(*ast.Array); ok {
			s.Required = make([]string, 0, len(arr.Items))
			for _, item := range arr.Items {
				if sv, ok := item.(*ast.StringVal); ok {
					s.Required = append(s.Required, sv.Value)
				}
			}
		}
	case "minimum":
		if nv, ok := value.(*ast.NumberVal); ok {
			v := nv.FloatVal
			if !nv.IsFloat {
				v = float64(nv.IntVal)
			}
			s.Minimum = &v
		}
	case "maximum":
		if nv, ok := value.(*ast.NumberVal); ok {
			v := nv.FloatVal
			if !nv.IsFloat {
				v = float64(nv.IntVal)
			}
			s.Maximum = &v
		}
	case "minLength":
		if nv, ok := value.(*ast.NumberVal); ok {
			v := nv.IntVal
			s.MinLength = &v
		}
	case "maxLength":
		if nv, ok := value.(*ast.NumberVal); ok {
			v := nv.IntVal
			s.MaxLength = &v
		}
	case "pattern":
		if sv, ok := value.(*ast.StringVal); ok {
			s.Pattern = sv.Value
		}
	case "description":
		if sv, ok := value.(*ast.StringVal); ok {
			s.Description = sv.Value
		}
	case "default":
		s.Default = astToInterface(value)
	case "properties":
		if obj, ok := value.(*ast.Object); ok {
			s.Properties = make(map[string]*Schema, len(obj.Entries))
			for _, entry := range obj.Entries {
				if ekv, ok := entry.(*ast.KeyValue); ok {
					sub := &Schema{Properties: make(map[string]*Schema)}
					sub.setTypeFromNode(ekv.Value, depth+1)
					s.Properties[ekv.Key] = sub
				}
			}
		}
	case "enum":
		if arr, ok := value.(*ast.Array); ok {
			s.Enum = make([]interface{}, 0, len(arr.Items))
			for _, item := range arr.Items {
				s.Enum = append(s.Enum, astToInterface(item))
			}
		}
	case "items":
		sub := &Schema{Properties: make(map[string]*Schema)}
		sub.setTypeFromNode(value, depth+1)
		s.Items = sub
	}
}

func (s *Schema) setTypeFromNode(node ast.Node, depth int) {
	if depth > maxSchemaDepth {
		return
	}
	if sv, ok := node.(*ast.StringVal); ok {
		s.Type = sv.Value
	}
	if obj, ok := node.(*ast.Object); ok {
		s.Type = "object"
		for _, entry := range obj.Entries {
			if kv, ok := entry.(*ast.KeyValue); ok {
				s.setProperty(kv.Key, kv.Value, depth+1)
			}
		}
	}
}

func (s *Schema) Compile() error {
	if s.Pattern != "" {
		re, err := regexp.Compile(s.Pattern)
		if err != nil {
			return fmt.Errorf("invalid pattern %q: %w", s.Pattern, err)
		}
		s.compiled = re
	}

	if s.Properties != nil {
		for _, prop := range s.Properties {
			if err := prop.Compile(); err != nil {
				return err
			}
		}
	}

	if s.Items != nil {
		if err := s.Items.Compile(); err != nil {
			return err
		}
	}

	return nil
}

func (s *Schema) Validate(data interface{}) []ValidationError {
	var errs []ValidationError
	s.validate(data, "", &errs, 0)
	return errs
}

func (s *Schema) validate(data interface{}, path string, errs *[]ValidationError, depth int) {
	if depth > maxSchemaDepth {
		return
	}

	if s.Type != "" {
		if !s.checkType(data) {
			*errs = append(*errs, ValidationError{
				Path:    path,
				Message: fmt.Sprintf("expected type %s, got %T", s.Type, data),
			})
			return
		}
	}

	switch s.Type {
	case "object":
		s.validateObject(data, path, errs, depth)
	case "string":
		s.validateString(data, path, errs)
	case "integer", "number":
		s.validateNumber(data, path, errs)
	case "array":
		s.validateArray(data, path, errs, depth)
	}
}

func (s *Schema) checkType(data interface{}) bool {
	switch s.Type {
	case "string":
		_, ok := data.(string)
		return ok
	case "integer":
		_, ok := data.(int)
		return ok
	case "number":
		switch data.(type) {
		case int, int64, float32, float64:
			return true
		}
		return false
	case "boolean":
		_, ok := data.(bool)
		return ok
	case "null":
		return data == nil
	case "array":
		_, ok := data.([]interface{})
		return ok
	case "object":
		_, ok := data.(map[string]interface{})
		return ok
	}
	return true
}

func (s *Schema) validateObject(data interface{}, path string, errs *[]ValidationError, depth int) {
	m, ok := data.(map[string]interface{})
	if !ok {
		return
	}

	for _, req := range s.Required {
		if _, exists := m[req]; !exists {
			*errs = append(*errs, ValidationError{
				Path:    path,
				Message: fmt.Sprintf("missing required property %q", req),
			})
		}
	}

	if s.Properties != nil {
		for key, propSchema := range s.Properties {
			if val, exists := m[key]; exists {
				newPath := path + "." + key
				if path == "" {
					newPath = key
				}
				propSchema.validate(val, newPath, errs, depth+1)
			}
		}
	}
}

func (s *Schema) validateString(data interface{}, path string, errs *[]ValidationError) {
	str, ok := data.(string)
	if !ok {
		return
	}

	if s.MinLength != nil && len(str) < *s.MinLength {
		*errs = append(*errs, ValidationError{
			Path:    path,
			Message: fmt.Sprintf("string length %d less than minimum %d", len(str), *s.MinLength),
		})
	}

	if s.MaxLength != nil && len(str) > *s.MaxLength {
		*errs = append(*errs, ValidationError{
			Path:    path,
			Message: fmt.Sprintf("string length %d greater than maximum %d", len(str), *s.MaxLength),
		})
	}

	if s.compiled != nil && !s.compiled.MatchString(str) {
		*errs = append(*errs, ValidationError{
			Path:    path,
			Message: fmt.Sprintf("string does not match pattern %q", s.Pattern),
		})
	}

	if len(s.Enum) > 0 {
		found := false
		for _, e := range s.Enum {
			if e == str {
				found = true
				break
			}
		}
		if !found {
			*errs = append(*errs, ValidationError{
				Path:    path,
				Message: fmt.Sprintf("value %q not in enum", str),
			})
		}
	}
}

func (s *Schema) validateNumber(data interface{}, path string, errs *[]ValidationError) {
	var f float64
	switch v := data.(type) {
	case int:
		f = float64(v)
	case int64:
		f = float64(v)
	case float32:
		f = float64(v)
	case float64:
		f = v
	default:
		return
	}

	if s.Minimum != nil && f < *s.Minimum {
		*errs = append(*errs, ValidationError{
			Path:    path,
			Message: fmt.Sprintf("value %g less than minimum %g", f, *s.Minimum),
		})
	}

	if s.Maximum != nil && f > *s.Maximum {
		*errs = append(*errs, ValidationError{
			Path:    path,
			Message: fmt.Sprintf("value %g greater than maximum %g", f, *s.Maximum),
		})
	}
}

func (s *Schema) validateArray(data interface{}, path string, errs *[]ValidationError, depth int) {
	arr, ok := data.([]interface{})
	if !ok {
		return
	}

	if s.Items != nil {
		for i, item := range arr {
			s.Items.validate(item, fmt.Sprintf("%s[%d]", path, i), errs, depth+1)
		}
	}
}

func astToInterface(node ast.Node) interface{} {
	switch n := node.(type) {
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
	}
	return nil
}

type ValidationError struct {
	Path    string
	Message string
}

func (e ValidationError) String() string {
	if e.Path == "" {
		return e.Message
	}
	return fmt.Sprintf("%s: %s", e.Path, e.Message)
}

func FormatErrors(errs []ValidationError) string {
	if len(errs) == 0 {
		return "Validation passed.\n"
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%d validation error(s):\n", len(errs)))
	for _, e := range errs {
		sb.WriteString("  - " + e.String() + "\n")
	}
	return sb.String()
}
