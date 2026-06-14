package main

import (
	"fmt"
	"os"

	gomlfmt "github.com/goml-lang/goml/internal/fmt"
	"github.com/goml-lang/goml/internal/lint"
	"github.com/goml-lang/goml/internal/schema"
	"github.com/goml-lang/goml/internal/convert"
	"github.com/goml-lang/goml/pkg/goml"
)

const version = "0.1.0"

const usage = `goml - Go Markup Language CLI

Usage:
  goml <command> [options] [file...]

Commands:
  fmt        Format GOML files
  lint       Lint GOML files for issues
  validate   Validate GOML files against a schema
  convert    Convert between GOML, JSON, YAML, TOML
  version    Show version
  help       Show this help

Examples:
  goml fmt config.goml
  goml lint config.goml
  goml validate -s schema.goml config.goml
  goml convert -f json -t goml config.json
`

func main() {
	if len(os.Args) < 2 {
		fmt.Print(usage)
		os.Exit(0)
	}

	cmd := os.Args[1]

	switch cmd {
	case "fmt":
		cmdFmt(os.Args[2:])
	case "lint":
		cmdLint(os.Args[2:])
	case "validate":
		cmdValidate(os.Args[2:])
	case "convert":
		cmdConvert(os.Args[2:])
	case "version":
		fmt.Printf("goml v%s\n", version)
	case "help", "-h", "--help":
		fmt.Print(usage)
	default:
		fmt.Fprintf(os.Stderr, "Unknown command: %s\n\n", cmd)
		fmt.Print(usage)
		os.Exit(1)
	}
}

func cmdFmt(args []string) {
	formatter := gomlfmt.New()

	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "Usage: goml fmt <file...>")
		os.Exit(1)
	}

	for _, path := range args {
		if err := formatter.FormatFile(path); err != nil {
			fmt.Fprintf(os.Stderr, "Error formatting %s: %v\n", path, err)
			os.Exit(1)
		}
		fmt.Printf("Formatted %s\n", path)
	}
}

func cmdLint(args []string) {
	l := lint.New()

	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "Usage: goml lint <file...>")
		os.Exit(1)
	}

	hasErrors := false
	for _, path := range args {
		issues, err := l.LintFile(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error linting %s: %v\n", path, err)
			os.Exit(1)
		}

		if len(issues) > 0 {
			fmt.Printf("%s:\n", path)
			for _, issue := range issues {
				fmt.Printf("  %s\n", issue)
				if issue.Severity == lint.Error {
					hasErrors = true
				}
			}
		} else {
			fmt.Printf("%s: OK\n", path)
		}
	}

	if hasErrors {
		os.Exit(1)
	}
}

func cmdValidate(args []string) {
	var schemaPath string
	var files []string

	for i := 0; i < len(args); i++ {
		if args[i] == "-s" || args[i] == "--schema" {
			if i+1 < len(args) {
				schemaPath = args[i+1]
				i++
			} else {
				fmt.Fprintln(os.Stderr, "Missing schema path after -s")
				os.Exit(1)
			}
		} else {
			files = append(files, args[i])
		}
	}

	if schemaPath == "" || len(files) == 0 {
		fmt.Fprintln(os.Stderr, "Usage: goml validate -s schema.goml <file...>")
		os.Exit(1)
	}

	s, err := schema.Load(schemaPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error loading schema: %v\n", err)
		os.Exit(1)
	}

	if err := s.Compile(); err != nil {
		fmt.Fprintf(os.Stderr, "Error compiling schema: %v\n", err)
		os.Exit(1)
	}

	hasErrors := false
	for _, path := range files {
		data, err := goml.ParseFile(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error parsing %s: %v\n", path, err)
			os.Exit(1)
		}

		errs := s.Validate(data)
		if len(errs) > 0 {
			fmt.Printf("%s:\n", path)
			for _, e := range errs {
				fmt.Printf("  - %s\n", e)
			}
			hasErrors = true
		} else {
			fmt.Printf("%s: valid\n", path)
		}
	}

	if hasErrors {
		os.Exit(1)
	}
}

func cmdConvert(args []string) {
	var fromStr, toStr string
	var files []string

	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "-f", "--from":
			if i+1 < len(args) {
				fromStr = args[i+1]
				i++
			}
		case "-t", "--to":
			if i+1 < len(args) {
				toStr = args[i+1]
				i++
			}
		default:
			files = append(files, args[i])
		}
	}

	if len(files) == 0 {
		fmt.Fprintln(os.Stderr, "Usage: goml convert [-f from] -t to <file...>")
		os.Exit(1)
	}

	from := convert.Format(fromStr)
	to := convert.Format(toStr)

	for _, path := range files {
		data, err := os.ReadFile(path)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading %s: %v\n", path, err)
			os.Exit(1)
		}

		inputFormat := from
		if inputFormat == "" {
			inputFormat = convert.DetectFormat(path)
		}

		outputFormat := to
		if outputFormat == "" {
			outputFormat = convert.FormatGOML
		}

		result, err := convert.Convert(string(data), inputFormat, outputFormat)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error converting %s: %v\n", path, err)
			os.Exit(1)
		}

		outPath := path + "." + string(outputFormat)
		if err := os.WriteFile(outPath, []byte(result), 0644); err != nil {
			fmt.Fprintf(os.Stderr, "Error writing %s: %v\n", outPath, err)
			os.Exit(1)
		}

		fmt.Printf("Converted %s -> %s\n", path, outPath)
	}
}
