package convert

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Aswanidev-vs/goml/pkg/goml"
)

type Format string

const (
	FormatJSON Format = "json"
	FormatYAML Format = "yaml"
	FormatTOML Format = "toml"
	FormatGOML Format = "goml"
)

func DetectFormat(path string) Format {
	ext := strings.ToLower(path)
	switch {
	case strings.HasSuffix(ext, ".json"):
		return FormatJSON
	case strings.HasSuffix(ext, ".yaml") || strings.HasSuffix(ext, ".yml"):
		return FormatYAML
	case strings.HasSuffix(ext, ".toml"):
		return FormatTOML
	case strings.HasSuffix(ext, ".goml"):
		return FormatGOML
	}
	return FormatJSON
}

func Convert(input string, from, to Format) (string, error) {
	data, err := parseInput(input, from)
	if err != nil {
		return "", fmt.Errorf("parse error: %w", err)
	}

	return serializeOutput(data, to)
}

func parseInput(input string, format Format) (interface{}, error) {
	switch format {
	case FormatGOML:
		return goml.ParseString(input)
	case FormatJSON:
		var result interface{}
		if err := json.Unmarshal([]byte(input), &result); err != nil {
			return nil, err
		}
		return result, nil
	case FormatYAML:
		return nil, fmt.Errorf("yaml support requires: go get gopkg.in/yaml.v3")
	case FormatTOML:
		return nil, fmt.Errorf("toml support requires: go get github.com/BurntSushi/toml")
	default:
		return nil, fmt.Errorf("unsupported input format: %s", format)
	}
}

func serializeOutput(data interface{}, format Format) (string, error) {
	switch format {
	case FormatGOML:
		return goml.Marshal(data), nil
	case FormatJSON:
		result, err := json.MarshalIndent(data, "", "  ")
		if err != nil {
			return "", err
		}
		return string(result) + "\n", nil
	case FormatYAML:
		return "", fmt.Errorf("yaml support requires: go get gopkg.in/yaml.v3")
	case FormatTOML:
		return "", fmt.Errorf("toml support requires: go get github.com/BurntSushi/toml")
	default:
		return "", fmt.Errorf("unsupported output format: %s", format)
	}
}
