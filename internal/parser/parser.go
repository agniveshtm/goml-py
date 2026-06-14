package parser

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/goml-lang/goml/internal/ast"
	"github.com/goml-lang/goml/internal/lexer"
)

type Parser struct {
	tokens []lexer.Token
	pos    int
	depth  int
}

const maxDepth = 256

func New(input string) *Parser {
	lx := lexer.New(input)
	tokens, _ := lx.Tokenize()
	return &Parser{tokens: tokens, pos: 0, depth: 0}
}

func Parse(input string) (*ast.Document, error) {
	p := New(input)
	return p.ParseDocument()
}

func (p *Parser) current() lexer.Token {
	if p.pos >= len(p.tokens) {
		return lexer.Token{Type: lexer.TokenEOF}
	}
	return p.tokens[p.pos]
}

func (p *Parser) advance() lexer.Token {
	tok := p.current()
	if p.pos < len(p.tokens) {
		p.pos++
	}
	return tok
}

func (p *Parser) skipComments() {
	for p.current().Type == lexer.TokenComment {
		p.advance()
	}
}

func (p *Parser) ParseDocument() (*ast.Document, error) {
	doc := &ast.Document{}

	for p.current().Type != lexer.TokenEOF {
		p.skipComments()
		if p.current().Type == lexer.TokenEOF {
			break
		}

		stmt, err := p.parseStatement()
		if err != nil {
			return nil, err
		}
		if stmt != nil {
			doc.Statements = append(doc.Statements, stmt)
		}

		if p.current().Type == lexer.TokenComma {
			p.advance()
		}
	}

	return doc, nil
}

func (p *Parser) parseStatement() (ast.Node, error) {
	tok := p.current()

	if tok.Type == lexer.TokenComment {
		p.advance()
		return &ast.Comment{Text: tok.Literal, Line: tok.Line, Col: tok.Col}, nil
	}

	if tok.Type == lexer.TokenIdent {
		return p.parseKeyOrObject()
	}

	p.advance()
	return nil, nil
}

func (p *Parser) parseKeyOrObject() (ast.Node, error) {
	keyTok := p.advance()
	key := keyTok.Literal

	// Handle dot notation: server.host = value -> nested objects
	if strings.Contains(key, ".") {
		return p.parseDotNotation(key, keyTok)
	}

	p.skipComments()

	if p.current().Type == lexer.TokenEquals {
		p.advance()
		p.skipComments()
		val, err := p.parseValue()
		if err != nil {
			return nil, err
		}
		kv := &ast.KeyValue{Key: key, Value: val, Line: keyTok.Line, Col: keyTok.Col}
		p.skipComments()
		return kv, nil
	}

	if p.current().Type == lexer.TokenLBrace {
		obj, err := p.parseObject()
		if err != nil {
			return nil, err
		}
		obj.Line = keyTok.Line
		obj.Col = keyTok.Col
		kv := &ast.KeyValue{Key: key, Value: obj, Line: keyTok.Line, Col: keyTok.Col}
		p.skipComments()
		return kv, nil
	}

	if p.current().Type == lexer.TokenLBracket {
		arr, err := p.parseArray()
		if err != nil {
			return nil, err
		}
		arr.Line = keyTok.Line
		arr.Col = keyTok.Col
		kv := &ast.KeyValue{Key: key, Value: arr, Line: keyTok.Line, Col: keyTok.Col}
		p.skipComments()
		return kv, nil
	}

	val := &ast.StringVal{Value: key, Line: keyTok.Line, Col: keyTok.Col}
	kv := &ast.KeyValue{Key: key, Value: val, Line: keyTok.Line, Col: keyTok.Col}
	return kv, nil
}

func (p *Parser) parseDotNotation(key string, keyTok lexer.Token) (ast.Node, error) {
	p.skipComments()

	if p.current().Type != lexer.TokenEquals {
		return nil, fmt.Errorf("expected '=' after dot notation key %q at %d:%d", key, keyTok.Line, keyTok.Col)
	}
	p.advance()
	p.skipComments()

	val, err := p.parseValue()
	if err != nil {
		return nil, err
	}

	parts := strings.Split(key, ".")
	if len(parts) == 1 {
		kv := &ast.KeyValue{Key: key, Value: val, Line: keyTok.Line, Col: keyTok.Col}
		return kv, nil
	}

	// Build nested objects from the inside out
	result := val
	for i := len(parts) - 1; i > 0; i-- {
		obj := &ast.Object{
			Entries: []ast.Node{
				&ast.KeyValue{Key: parts[i], Value: result, Line: keyTok.Line, Col: keyTok.Col},
			},
			Line: keyTok.Line,
			Col:  keyTok.Col,
		}
		result = obj
	}

	kv := &ast.KeyValue{Key: parts[0], Value: result, Line: keyTok.Line, Col: keyTok.Col}
	p.skipComments()
	return kv, nil
}

func (p *Parser) parseObject() (*ast.Object, error) {
	if p.depth >= maxDepth {
		return nil, fmt.Errorf("maximum nesting depth %d exceeded at line %d", maxDepth, p.current().Line)
	}
	p.depth++

	tok := p.current()
	obj := &ast.Object{Line: tok.Line, Col: tok.Col}
	p.advance()
	p.skipComments()

	for p.current().Type != lexer.TokenRBrace && p.current().Type != lexer.TokenEOF {
		if p.current().Type == lexer.TokenComment {
			p.advance()
			p.skipComments()
			continue
		}

		if p.current().Type == lexer.TokenIdent {
			entry, err := p.parseKeyOrObject()
			if err != nil {
				p.depth--
				return nil, err
			}
			if entry != nil {
				obj.Entries = append(obj.Entries, entry)
			}
		} else {
			p.advance()
		}
		p.skipComments()

		if p.current().Type == lexer.TokenComma {
			p.advance()
			p.skipComments()
		}
	}

	if p.current().Type == lexer.TokenRBrace {
		p.advance()
	} else {
		p.depth--
		return nil, fmt.Errorf("expected '}' at line %d", tok.Line)
	}

	p.depth--
	return obj, nil
}

func (p *Parser) parseArray() (*ast.Array, error) {
	if p.depth >= maxDepth {
		return nil, fmt.Errorf("maximum nesting depth %d exceeded at line %d", maxDepth, p.current().Line)
	}
	p.depth++

	tok := p.current()
	arr := &ast.Array{Line: tok.Line, Col: tok.Col}
	p.advance()
	p.skipComments()

	for p.current().Type != lexer.TokenRBracket && p.current().Type != lexer.TokenEOF {
		if p.current().Type == lexer.TokenComment {
			p.advance()
			p.skipComments()
			continue
		}

		if p.current().Type == lexer.TokenLBrace {
			obj, err := p.parseObject()
			if err != nil {
				p.depth--
				return nil, err
			}
			arr.Items = append(arr.Items, obj)
		} else {
			val, err := p.parseValue()
			if err != nil {
				p.depth--
				return nil, err
			}
			arr.Items = append(arr.Items, val)
		}

		p.skipComments()
		if p.current().Type == lexer.TokenComma {
			p.advance()
			p.skipComments()
		}
	}

	if p.current().Type == lexer.TokenRBracket {
		p.advance()
	} else {
		p.depth--
		return nil, fmt.Errorf("expected ']' at line %d", tok.Line)
	}

	p.depth--
	return arr, nil
}

func (p *Parser) parseValue() (ast.Node, error) {
	p.skipComments()
	tok := p.current()

	switch tok.Type {
	case lexer.TokenString:
		p.advance()
		return &ast.StringVal{Value: tok.Literal, Line: tok.Line, Col: tok.Col}, nil

	case lexer.TokenNumber:
		p.advance()
		return p.parseNumber(tok)

	case lexer.TokenBoolean:
		p.advance()
		val := tok.Literal == "true"
		return &ast.BoolVal{Value: val, Line: tok.Line, Col: tok.Col}, nil

	case lexer.TokenNull:
		p.advance()
		return &ast.NullVal{Line: tok.Line, Col: tok.Col}, nil

	case lexer.TokenLBracket:
		return p.parseArray()

	case lexer.TokenLBrace:
		return p.parseObject()

	case lexer.TokenDollar:
		return p.parseReference()

	case lexer.TokenIdent:
		p.advance()
		return &ast.StringVal{Value: tok.Literal, Line: tok.Line, Col: tok.Col}, nil

	default:
		return nil, fmt.Errorf("unexpected token %s at %d:%d", tok.Type, tok.Line, tok.Col)
	}
}

func (p *Parser) parseNumber(tok lexer.Token) (ast.Node, error) {
	val := tok.Literal
	if strings.Contains(val, ".") {
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid float %q at %d:%d", val, tok.Line, tok.Col)
		}
		return &ast.NumberVal{Value: val, IsFloat: true, FloatVal: f, Line: tok.Line, Col: tok.Col}, nil
	}
	i, err := strconv.Atoi(val)
	if err != nil {
		return nil, fmt.Errorf("invalid integer %q at %d:%d", val, tok.Line, tok.Col)
	}
	return &ast.NumberVal{Value: val, IsFloat: false, IntVal: i, Line: tok.Line, Col: tok.Col}, nil
}

func (p *Parser) parseReference() (*ast.Reference, error) {
	tok := p.current()
	p.advance()

	pathTok := p.current()
	if pathTok.Type != lexer.TokenIdent {
		return nil, fmt.Errorf("expected identifier after $ at %d:%d", tok.Line, tok.Col)
	}

	path := pathTok.Literal
	p.advance()

	for p.current().Type == lexer.TokenDot {
		p.advance()
		next := p.current()
		if next.Type != lexer.TokenIdent {
			return nil, fmt.Errorf("expected identifier after . at %d:%d", next.Line, next.Col)
		}
		path += "." + next.Literal
		p.advance()
	}

	return &ast.Reference{Path: path, Line: tok.Line, Col: tok.Col}, nil
}
