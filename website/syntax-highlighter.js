// GOML Syntax Highlighter
// Tokenizer + real-time highlighter for the playground

const TOKEN_TYPES = {
    COMMENT: 'comment',
    KEY: 'key',
    STRING: 'string',
    NUMBER: 'number',
    BOOL: 'bool',
    NULL: 'null',
    REF: 'ref',
    OPERATOR: 'operator',
    WHITESPACE: 'ws',
    IDENT: 'ident',
    DOT: 'dot',
    NEWLINE: 'newline',
};

class Token {
    constructor(type, value, line, col) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.col = col;
    }
}

class GomlTokenizer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.tokens = [];
    }

    peek(offset = 0) {
        return this.input[this.pos + offset] || '\0';
    }

    advance() {
        const ch = this.input[this.pos++];
        if (ch === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        return ch;
    }

    readSingleLineComment() {
        const startLine = this.line;
        const startCol = this.col;
        let comment = '';
        while (this.peek() !== '\n' && this.peek() !== '\0') {
            comment += this.advance();
        }
        this.tokens.push(new Token(TOKEN_TYPES.COMMENT, comment, startLine, startCol));
    }

    readMultiLineComment() {
        const startLine = this.line;
        const startCol = this.col;
        let comment = '';
        comment += this.advance(); // '/'
        comment += this.advance(); // '*'
        while (!(this.peek() === '*' && this.peek(1) === '/') && this.peek() !== '\0') {
            comment += this.advance();
        }
        if (this.peek() === '*' && this.peek(1) === '/') {
            comment += this.advance(); // '*'
            comment += this.advance(); // '/'
        }
        this.tokens.push(new Token(TOKEN_TYPES.COMMENT, comment, startLine, startCol));
    }

    readDoubleQuotedString() {
        const startLine = this.line;
        const startCol = this.col;
        let str = '';
        str += this.advance(); // opening
        while (this.peek() !== '"' && this.peek() !== '\0' && this.peek() !== '\n') {
            if (this.peek() === '\\') {
                str += this.advance();
            }
            str += this.advance();
        }
        if (this.peek() === '"') {
            str += this.advance(); // closing
        }
        this.tokens.push(new Token(TOKEN_TYPES.STRING, str, startLine, startCol));
    }

    readSingleQuotedString() {
        const startLine = this.line;
        const startCol = this.col;
        let str = '';
        str += this.advance(); // opening
        while (this.peek() !== "'" && this.peek() !== '\0' && this.peek() !== '\n') {
            str += this.advance();
        }
        if (this.peek() === "'") {
            str += this.advance(); // closing
        }
        this.tokens.push(new Token(TOKEN_TYPES.STRING, str, startLine, startCol));
    }

    readNumber() {
        const startLine = this.line;
        const startCol = this.col;
        let num = '';
        if (this.peek() === '-') {
            num += this.advance();
        }
        while (/\d/.test(this.peek())) {
            num += this.advance();
        }
        if (this.peek() === '.' && /\d/.test(this.peek(1))) {
            num += this.advance();
            while (/\d/.test(this.peek())) {
                num += this.advance();
            }
        }
        this.tokens.push(new Token(TOKEN_TYPES.NUMBER, num, startLine, startCol));
    }

    readIdentifier() {
        const startLine = this.line;
        const startCol = this.col;
        let ident = '';
        while (/[a-zA-Z0-9_-]/.test(this.peek())) {
            ident += this.advance();
        }
        const lower = ident.toLowerCase();
        if (lower === 'true' || lower === 'false') {
            this.tokens.push(new Token(TOKEN_TYPES.BOOL, ident, startLine, startCol));
        } else if (lower === 'null') {
            this.tokens.push(new Token(TOKEN_TYPES.NULL, ident, startLine, startCol));
        } else {
            this.tokens.push(new Token(TOKEN_TYPES.IDENT, ident, startLine, startCol));
        }
    }

    readReference() {
        const startLine = this.line;
        const startCol = this.col;
        let ref = '';
        ref += this.advance(); // '$'
        while (/[a-zA-Z0-9_.-]/.test(this.peek())) {
            ref += this.advance();
        }
        this.tokens.push(new Token(TOKEN_TYPES.REF, ref, startLine, startCol));
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const startLine = this.line;
            const startCol = this.col;
            const ch = this.peek();

            if (ch === '#') {
                this.readSingleLineComment();
                continue;
            }
            if (ch === '/' && this.peek(1) === '/') {
                this.readSingleLineComment();
                continue;
            }
            if (ch === '/' && this.peek(1) === '*') {
                this.readMultiLineComment();
                continue;
            }

            if (ch === '\n') {
                this.advance();
                this.tokens.push(new Token(TOKEN_TYPES.NEWLINE, '\n', startLine, startCol));
                continue;
            }
            if (ch === '\r') {
                this.advance();
                if (this.peek() === '\n') this.advance();
                this.tokens.push(new Token(TOKEN_TYPES.NEWLINE, '\r\n', startLine, startCol));
                continue;
            }
            if (/\s/.test(ch)) {
                let ws = '';
                while (/\s/.test(this.peek()) && this.peek() !== '\n' && this.peek() !== '\r') {
                    ws += this.advance();
                }
                this.tokens.push(new Token(TOKEN_TYPES.WHITESPACE, ws, startLine, startCol));
                continue;
            }
            if (ch === '"') {
                this.readDoubleQuotedString();
                continue;
            }
            if (ch === "'") {
                this.readSingleQuotedString();
                continue;
            }
            if (/\d/.test(ch) || (ch === '-' && /\d/.test(this.peek(1)))) {
                this.readNumber();
                continue;
            }
            if (ch === '=' || ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ',') {
                this.advance();
                this.tokens.push(new Token(TOKEN_TYPES.OPERATOR, ch, startLine, startCol));
                continue;
            }
            if (ch === '.') {
                this.advance();
                this.tokens.push(new Token(TOKEN_TYPES.DOT, '.', startLine, startCol));
                continue;
            }
            if (ch === '$') {
                this.readReference();
                continue;
            }
            if (/[a-zA-Z_]/.test(ch)) {
                this.readIdentifier();
                continue;
            }
            this.advance();
            this.tokens.push(new Token('unknown', ch, startLine, startCol));
        }
        return this.tokens;
    }
}

function classifyLine(tokens) {
    const result = [];
    let foundEquals = false;
    let foundBlock = false;
    let meaningfulCount = 0;

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (t.type === TOKEN_TYPES.WHITESPACE || t.type === TOKEN_TYPES.NEWLINE) {
            result.push(t);
            continue;
        }

        if (t.type === TOKEN_TYPES.OPERATOR && t.value === '=') {
            foundEquals = true;
            result.push(t);
            meaningfulCount++;
            continue;
        }
        if (t.type === TOKEN_TYPES.OPERATOR && t.value === '{') {
            foundBlock = true;
            result.push(t);
            meaningfulCount++;
            continue;
        }

        if (t.type === TOKEN_TYPES.IDENT) {
            if (!foundEquals && !foundBlock && meaningfulCount === 0) {
                t.type = TOKEN_TYPES.KEY;
                result.push(t);
                meaningfulCount++;
                continue;
            }
        }

        if (t.type === TOKEN_TYPES.DOT) {
            // Dots are part of key path or separator
            result.push(t);
            meaningfulCount++;
            continue;
        }

        result.push(t);
        meaningfulCount++;
    }

    return result;
}

function classifyTokens(tokens) {
    const result = [];
    let lineTokens = [];

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type === TOKEN_TYPES.NEWLINE) {
            const classified = classifyLine(lineTokens);
            result.push(...classified);
            result.push(t);
            lineTokens = [];
        } else {
            lineTokens.push(t);
        }
    }
    if (lineTokens.length > 0) {
        const classified = classifyLine(lineTokens);
        result.push(...classified);
    }

    return result;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function tokensToHtml(tokens) {
    const mapping = {
        [TOKEN_TYPES.COMMENT]: 'c-comment',
        [TOKEN_TYPES.KEY]: 'c-key',
        [TOKEN_TYPES.STRING]: 'c-string',
        [TOKEN_TYPES.NUMBER]: 'c-number',
        [TOKEN_TYPES.BOOL]: 'c-bool',
        [TOKEN_TYPES.NULL]: 'c-bool',
        [TOKEN_TYPES.REF]: 'c-ref',
        [TOKEN_TYPES.OPERATOR]: '',
        [TOKEN_TYPES.DOT]: '',
        [TOKEN_TYPES.WHITESPACE]: '',
        [TOKEN_TYPES.IDENT]: 'c-string',
        [TOKEN_TYPES.NEWLINE]: '',
        'unknown': '',
    };

    let html = '';
    for (const t of tokens) {
        if (t.type === TOKEN_TYPES.NEWLINE) {
            html += '\n';
            continue;
        }
        const cls = mapping[t.type] || '';
        const val = escapeHtml(t.value);
        if (cls) {
            html += `<span class="${cls}">${val}</span>`;
        } else {
            html += val;
        }
    }
    return html;
}

function highlightGoml(source) {
    const tokenizer = new GomlTokenizer(source);
    const tokens = tokenizer.tokenize();
    const classified = classifyTokens(tokens);
    return tokensToHtml(classified);
}

if (typeof window !== 'undefined') {
    window.highlightGoml = highlightGoml;
    window.GomlTokenizer = GomlTokenizer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { highlightGoml, GomlTokenizer, classifyTokens };
}
