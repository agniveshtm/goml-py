package validator

import (
	"fmt"
	"io"

	"github.com/Aswanidev-vs/goml/internal/schema"
	"github.com/Aswanidev-vs/goml/pkg/goml"
)

type Validator struct {
	schema     *schema.Schema
	strictMode bool
}

type ValidationError = schema.ValidationError

func New(schemaPath string) (*Validator, error) {
	s, err := schema.Load(schemaPath)
	if err != nil {
		return nil, fmt.Errorf("load schema: %w", err)
	}

	if err := s.Compile(); err != nil {
		return nil, fmt.Errorf("compile schema: %w", err)
	}

	return &Validator{schema: s, strictMode: true}, nil
}

func (v *Validator) SetStrict(strict bool) {
	v.strictMode = strict
}

func (v *Validator) ValidateFile(path string) ([]ValidationError, error) {
	data, err := goml.ParseFile(path)
	if err != nil {
		return nil, fmt.Errorf("parse file: %w", err)
	}
	return v.Validate(data), nil
}

const maxReaderSize = 10 * 1024 * 1024 // 10MB

func (v *Validator) ValidateReader(r io.Reader) ([]ValidationError, error) {
	data, err := io.ReadAll(io.LimitReader(r, maxReaderSize+1))
	if err != nil {
		return nil, fmt.Errorf("read: %w", err)
	}
	if len(data) > maxReaderSize {
		return nil, fmt.Errorf("input too large (max %d bytes)", maxReaderSize)
	}

	parsed, err := goml.ParseBytes(data)
	if err != nil {
		return nil, fmt.Errorf("parse: %w", err)
	}

	return v.Validate(parsed), nil
}

func (v *Validator) ValidateBytes(data []byte) ([]ValidationError, error) {
	parsed, err := goml.ParseBytes(data)
	if err != nil {
		return nil, fmt.Errorf("parse: %w", err)
	}
	return v.Validate(parsed), nil
}

func (v *Validator) ValidateString(input string) ([]ValidationError, error) {
	parsed, err := goml.ParseString(input)
	if err != nil {
		return nil, fmt.Errorf("parse: %w", err)
	}
	return v.Validate(parsed), nil
}

func (v *Validator) Validate(data interface{}) []ValidationError {
	return v.schema.Validate(data)
}

func Validate(schemaPath, filePath string) ([]ValidationError, error) {
	v, err := New(schemaPath)
	if err != nil {
		return nil, err
	}
	return v.ValidateFile(filePath)
}

func FormatErrors(errs []ValidationError) string {
	if len(errs) == 0 {
		return "Validation passed.\n"
	}

	result := fmt.Sprintf("%d error(s):\n", len(errs))
	for _, e := range errs {
		result += fmt.Sprintf("  - %s\n", e)
	}
	return result
}
