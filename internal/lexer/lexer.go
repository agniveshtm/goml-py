package lexer

import (
	"fmt"
)

type TokenType int

const (
	TokenEOF TokenType = iota
	TokenIdent
	TokenString
	TokenNumber
	TokenBoolean
	TokenNull
	TokenLBrace
	TokenRBrace
	TokenLBracket
	TokenRBracket
	TokenEquals
	TokenComma
	TokenDot
	TokenDollar
	TokenComment
)

var tokenNames = map[TokenType]string{
	TokenEOF: "EOF", TokenIdent: "IDENT",
	TokenString: "STRING", TokenNumber: "NUMBER", TokenBoolean: "BOOLEAN",
	TokenNull: "NULL", TokenLBrace: "{", TokenRBrace: "}",
	TokenLBracket: "[", TokenRBracket: "]", TokenEquals: "=",
	TokenComma: ",", TokenDot: ".", TokenDollar: "$",
	TokenComment: "COMMENT",
}

func (t TokenType) String() string {
	if s, ok := tokenNames[t]; ok {
		return s
	}
	return "UNKNOWN"
}

type Token struct {
	Type    TokenType
	Literal string
	Line    int
	Col     int
}

const (
	maxInputSize = 10 * 1024 * 1024
	maxStringLen = 1024 * 1024
	maxIdentLen  = 1024
	maxNumberLen = 64
	maxTokens    = 1 * 1000 * 1000
)

type Lexer struct {
	input  []byte
	pos    int
	line   int
	col    int
	tokens []Token
}

func New(input string) *Lexer {
	b := []byte(input)
	if len(b) > maxInputSize {
		b = b[:maxInputSize]
	}
	return &Lexer{input: b, pos: 0, line: 1, col: 1, tokens: make([]Token, 0, min(len(b)/4, 1024))}
}

func (l *Lexer) Tokenize() ([]Token, error) {
	for l.pos < len(l.input) {
		if len(l.tokens) >= maxTokens {
			return nil, fmt.Errorf("too many tokens (max %d) at line %d", maxTokens, l.line)
		}

		ch := l.input[l.pos]

		switch {
		case ch == ' ' || ch == '\t' || ch == '\r':
			l.pos++
			l.col++
		case ch == '\n':
			l.pos++
			l.line++
			l.col = 1
		case ch == '#':
			l.scanComment()
		case ch == '/' && l.peek() == '/':
			l.scanLineComment()
		case ch == '"', ch == '\'':
			if err := l.scanString(); err != nil {
				return nil, err
			}
		case ch == '{':
			l.addToken(TokenLBrace, "{")
			l.pos++
			l.col++
		case ch == '}':
			l.addToken(TokenRBrace, "}")
			l.pos++
			l.col++
		case ch == '[':
			l.addToken(TokenLBracket, "[")
			l.pos++
			l.col++
		case ch == ']':
			l.addToken(TokenRBracket, "]")
			l.pos++
			l.col++
		case ch == '=':
			l.addToken(TokenEquals, "=")
			l.pos++
			l.col++
		case ch == ',':
			l.addToken(TokenComma, ",")
			l.pos++
			l.col++
		case ch == '.':
			l.addToken(TokenDot, ".")
			l.pos++
			l.col++
		case ch == '$':
			l.addToken(TokenDollar, "$")
			l.pos++
			l.col++
		case ch == '~':
			l.addToken(TokenNull, "null")
			l.pos++
			l.col++
		case ch == '-' || isDigit(ch):
			l.scanNumber()
		case isIdentStart(ch):
			l.scanIdent()
		default:
			l.pos++
			l.col++
		}
	}

	l.addToken(TokenEOF, "")
	return l.tokens, nil
}

func (l *Lexer) peek() byte {
	if l.pos+1 >= len(l.input) {
		return 0
	}
	return l.input[l.pos+1]
}

func (l *Lexer) addToken(typ TokenType, lit string) {
	l.tokens = append(l.tokens, Token{Type: typ, Literal: lit, Line: l.line, Col: l.col})
}

func (l *Lexer) scanComment() {
	start := l.pos
	for l.pos < len(l.input) && l.input[l.pos] != '\n' {
		l.pos++
	}
	l.addToken(TokenComment, string(l.input[start:l.pos]))
}

func (l *Lexer) scanLineComment() {
	start := l.pos
	l.pos += 2
	l.col += 2
	for l.pos < len(l.input) && l.input[l.pos] != '\n' {
		l.pos++
	}
	l.addToken(TokenComment, string(l.input[start:l.pos]))
}

func (l *Lexer) scanString() error {
	quote := l.input[l.pos]
	startLine := l.line
	startCol := l.col
	l.pos++
	l.col++

	result := make([]byte, 0, 64)
	for l.pos < len(l.input) {
		if len(result) > maxStringLen {
			return fmt.Errorf("string too long (max %d chars) at %d:%d", maxStringLen, startLine, startCol)
		}

		ch := l.input[l.pos]
		if ch == '\n' {
			return fmt.Errorf("unterminated string at %d:%d", startLine, startCol)
		}
		if ch == '\\' && l.pos+1 < len(l.input) {
			l.pos++
			l.col++
			switch l.input[l.pos] {
			case 'n':
				result = append(result, '\n')
			case 't':
				result = append(result, '\t')
			case '\\':
				result = append(result, '\\')
			case '"':
				result = append(result, '"')
			case '\'':
				result = append(result, '\'')
			default:
				result = append(result, '\\', l.input[l.pos])
			}
		} else if ch == quote {
			l.pos++
			l.col++
			l.addToken(TokenString, string(result))
			return nil
		} else {
			result = append(result, ch)
		}
		l.pos++
		l.col++
	}
	return fmt.Errorf("unterminated string at %d:%d", startLine, startCol)
}

func (l *Lexer) scanNumber() {
	start := l.pos
	if l.input[l.pos] == '-' {
		l.pos++
		l.col++
	}
	for l.pos < len(l.input) && isDigit(l.input[l.pos]) {
		l.pos++
		l.col++
	}
	if l.pos < len(l.input) && l.input[l.pos] == '.' {
		l.pos++
		l.col++
		for l.pos < len(l.input) && isDigit(l.input[l.pos]) {
			l.pos++
			l.col++
		}
	}
	if l.pos-start > maxNumberLen {
		l.pos = start + maxNumberLen
	}
	l.addToken(TokenNumber, string(l.input[start:l.pos]))
}

func (l *Lexer) scanIdent() {
	start := l.pos
	for l.pos < len(l.input) && isIdentChar(l.input[l.pos]) {
		l.pos++
		l.col++
	}
	if l.pos-start > maxIdentLen {
		l.pos = start + maxIdentLen
	}
	word := string(l.input[start:l.pos])
	switch word {
	case "true", "false":
		l.addToken(TokenBoolean, word)
	case "null":
		l.addToken(TokenNull, word)
	default:
		l.addToken(TokenIdent, word)
	}
}

func isDigit(ch byte) bool {
	return ch >= '0' && ch <= '9'
}

func isIdentStart(ch byte) bool {
	return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch == '_' || ch == '-'
}

func isIdentChar(ch byte) bool {
	return isIdentStart(ch) || isDigit(ch) || ch == '.'
}
