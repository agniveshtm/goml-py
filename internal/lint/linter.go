package lint

import (
	"fmt"
	"os"
	"strings"

	"github.com/Aswanidev-vs/goml/internal/ast"
	"github.com/Aswanidev-vs/goml/internal/parser"
)

type Severity int

const (
	Warning Severity = iota
	Error
)

type Issue struct {
	Line     int
	Col      int
	Severity Severity
	Message  string
	Rule     string
}

func (i Issue) String() string {
	severity := "warning"
	if i.Severity == Error {
		severity = "error"
	}
	return fmt.Sprintf("%d:%d: %s: %s [%s]", i.Line, i.Col, severity, i.Message, i.Rule)
}

type Linter struct{}

func New() *Linter {
	return &Linter{}
}

func (l *Linter) Lint(input string) ([]Issue, error) {
	doc, err := parser.Parse(input)
	if err != nil {
		return []Issue{{
			Line:     0,
			Col:      0,
			Severity: Error,
			Message:  err.Error(),
			Rule:     "parse-error",
		}}, nil
	}

	var issues []Issue
	issues = append(issues, l.lintDocument(doc)...)
	return issues, nil
}

func (l *Linter) LintFile(path string) ([]Issue, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return l.Lint(string(data))
}

func (l *Linter) lintDocument(doc *ast.Document) []Issue {
	var issues []Issue
	seen := make(map[string]bool)

	for _, stmt := range doc.Statements {
		if kv, ok := stmt.(*ast.KeyValue); ok {
			if seen[kv.Key] {
				issues = append(issues, Issue{
					Line:     kv.Line,
					Col:      kv.Col,
					Severity: Warning,
					Message:  fmt.Sprintf("duplicate key %q", kv.Key),
					Rule:     "duplicate-key",
				})
			}
			seen[kv.Key] = true
			issues = append(issues, l.lintNode(kv.Value)...)
		} else if c, ok := stmt.(*ast.Comment); ok {
			if !strings.HasPrefix(strings.TrimSpace(c.Text), "#") && !strings.HasPrefix(strings.TrimSpace(c.Text), "//") {
				issues = append(issues, Issue{
					Line:     c.Line,
					Col:      c.Col,
					Severity: Warning,
					Message:  "non-standard comment style",
					Rule:     "comment-style",
				})
			}
		}
	}

	return issues
}

func (l *Linter) lintNode(node ast.Node) []Issue {
	var issues []Issue

	switch n := node.(type) {
	case *ast.Object:
		seen := make(map[string]bool)
		for _, entry := range n.Entries {
			if kv, ok := entry.(*ast.KeyValue); ok {
				if seen[kv.Key] {
					issues = append(issues, Issue{
						Line:     kv.Line,
						Col:      kv.Col,
						Severity: Warning,
						Message:  fmt.Sprintf("duplicate key %q in object", kv.Key),
						Rule:     "duplicate-key",
					})
				}
				seen[kv.Key] = true
				issues = append(issues, l.lintNode(kv.Value)...)
			}
		}

	case *ast.Array:
		for _, item := range n.Items {
			issues = append(issues, l.lintNode(item)...)
		}

	case *ast.StringVal:
		if n.Value == "" {
			issues = append(issues, Issue{
				Line:     n.Line,
				Col:      n.Col,
				Severity: Warning,
				Message:  "empty string value",
				Rule:     "empty-value",
			})
		}

	case *ast.Reference:
		if n.Path == "" {
			issues = append(issues, Issue{
				Line:     n.Line,
				Col:      n.Col,
				Severity: Error,
				Message:  "empty reference path",
				Rule:     "empty-reference",
			})
		}
	}

	return issues
}
