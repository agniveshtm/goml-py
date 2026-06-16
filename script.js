document.addEventListener('DOMContentLoaded', () => {
    initCompareTabs();
    initUsecaseTabs();
    initPlayground();
    initNavScroll();
    initMobileNav();
});

function highlightJson(str) {
    return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-bool';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + escapeHtml(match) + '</span>';
    });
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function highlightJsonOutput(str) {
    return escapeHtml(str).replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-bool';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

function highlightGomlOutput(str) {
    if (window.highlightGoml) {
        return highlightGoml(str);
    }
    return escapeHtml(str);
}

function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        links.classList.toggle('open');
        toggle.classList.toggle('active');
    });

    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.classList.remove('active');
        });
    });
}

function initCompareTabs() {
    const tabs = document.querySelectorAll('.compare-tab');
    const panels = document.querySelectorAll('.compare-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.querySelector(`[data-panel="${target}"]`).classList.add('active');
        });
    });
}

function initUsecaseTabs() {
    const tabs = document.querySelectorAll('.usecase-tab');
    const panels = document.querySelectorAll('.usecase-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.querySelector(`.usecase-panel[data-panel="${target}"]`).classList.add('active');
        });
    });
}

function initPlayground() {
    const editor = document.getElementById('goml-editor');
    const overlay = document.getElementById('highlight-overlay');
    const overlayCode = overlay.querySelector('code');
    const result = document.getElementById('json-result');
    const jsonToGomlBtn = document.getElementById('json-to-goml-btn');
    const gomlToJsonBtn = document.getElementById('goml-to-json-btn');
    const status = document.getElementById('parse-status');
    const inputTab = document.getElementById('input-tab');
    const outputTab = document.getElementById('output-tab');
    const editorInput = document.getElementById('editor-input');
    const editorOutput = document.getElementById('editor-output');
    let currentMode = 'json-to-goml';

    const gomlExample = `# Try editing this GOML
app {
  name = MyApp
  port = 8080
  debug = false
}

server {
  host = localhost
  port = 8080
  workers = 4
}

database {
  host = localhost
  port = 5432
  name = myapp
}

features = [auth, logging, cache]`;

    const jsonExample = `{
  "app": {
    "name": "MyApp",
    "port": 8080,
    "debug": false
  },
  "server": {
    "host": "localhost",
    "port": 8080,
    "workers": 4
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "features": ["auth", "logging", "cache"]
}`;

    function switchTab(tabIndex) {
        inputTab.classList.remove('active');
        outputTab.classList.remove('active');
        editorInput.classList.remove('active');
        editorOutput.classList.remove('active');

        if (tabIndex === 0) {
            inputTab.classList.add('active');
            editorInput.classList.add('active');
        } else {
            outputTab.classList.add('active');
            editorOutput.classList.add('active');
        }
    }

    function switchMode(mode) {
        currentMode = mode;
        
        if (mode === 'json-to-goml') {
            inputTab.textContent = 'JSON Input';
            outputTab.textContent = 'GOML Output';
            jsonToGomlBtn.classList.add('active');
            jsonToGomlBtn.classList.remove('btn-outline');
            jsonToGomlBtn.classList.add('btn-primary');
            gomlToJsonBtn.classList.remove('active');
            gomlToJsonBtn.classList.remove('btn-primary');
            gomlToJsonBtn.classList.add('btn-outline');
            editor.value = jsonExample;
        } else {
            inputTab.textContent = 'GOML Input';
            outputTab.textContent = 'JSON Output';
            gomlToJsonBtn.classList.add('active');
            gomlToJsonBtn.classList.remove('btn-outline');
            gomlToJsonBtn.classList.add('btn-primary');
            jsonToGomlBtn.classList.remove('active');
            jsonToGomlBtn.classList.remove('btn-primary');
            jsonToGomlBtn.classList.add('btn-outline');
            editor.value = gomlExample;
        }
        
        result.textContent = '';
        status.textContent = 'Ready';
        status.style.color = 'var(--text-muted)';
        switchTab(0);
        updateHighlight();
    }

    inputTab.addEventListener('click', () => switchTab(0));
    outputTab.addEventListener('click', () => switchTab(1));

    function updateHighlight() {
        const text = editor.value;
        if (currentMode === 'json-to-goml') {
            overlayCode.innerHTML = highlightJson(text);
            overlayCode.className = 'json-highlight';
        } else if (window.highlightGoml) {
            overlayCode.innerHTML = highlightGoml(text);
            overlayCode.className = '';
        } else {
            overlayCode.textContent = text;
            overlayCode.className = '';
        }
    }

    editor.addEventListener('input', updateHighlight);
    editor.addEventListener('scroll', () => {
        overlay.scrollTop = editor.scrollTop;
        overlay.scrollLeft = editor.scrollLeft;
    });

    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + 2;
            updateHighlight();
        }
    });

    updateHighlight();

    jsonToGomlBtn.addEventListener('click', () => {
        if (currentMode !== 'json-to-goml') {
            switchMode('json-to-goml');
        }
        
        status.textContent = 'Converting...';
        status.style.color = 'var(--text-muted)';

        setTimeout(() => {
            try {
                const jsonText = editor.value;
                const parsed = JSON.parse(jsonText);
                const gomlOutput = jsonToGoml(parsed);
                result.innerHTML = highlightGomlOutput(gomlOutput);
                status.textContent = 'Converted successfully';
                status.style.color = 'var(--accent)';
                switchTab(1);
            } catch (e) {
                result.innerHTML = `<span style="color: var(--red)">Error: ${escapeHtml(e.message)}</span>`;
                status.textContent = 'Conversion error';
                status.style.color = 'var(--red)';
            }
        }, 100);
    });

    gomlToJsonBtn.addEventListener('click', () => {
        if (currentMode !== 'goml-to-json') {
            switchMode('goml-to-json');
        }
        
        status.textContent = 'Parsing...';
        status.style.color = 'var(--text-muted)';

        setTimeout(() => {
            try {
                const gomlText = editor.value;
                const parsed = parseGoml(gomlText);
                const jsonOutput = JSON.stringify(parsed, null, 2);
                result.innerHTML = highlightJsonOutput(jsonOutput);
                status.textContent = 'Parsed successfully';
                status.style.color = 'var(--accent)';
                switchTab(1);
            } catch (e) {
                result.innerHTML = `<span style="color: var(--red)">Error: ${escapeHtml(e.message)}</span>`;
                status.textContent = 'Parse error';
                status.style.color = 'var(--red)';
            }
        }, 100);
    });
}

function parseGoml(input) {
    const lines = input.split('\n');
    const root = {};
    const stack = [{ obj: root, indent: -1 }];
    let arrayContext = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line || line.startsWith('#') || line.startsWith('//')) {
            continue;
        }

        const indent = lines[i].search(/\S/);

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }

        const current = stack[stack.length - 1].obj;

        const braceMatch = line.match(/^(\w+)\s*\{$/);
        if (braceMatch) {
            const key = braceMatch[1];
            current[key] = {};
            stack.push({ obj: current[key], indent: indent });
            continue;
        }

        const eqMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (eqMatch) {
            const key = eqMatch[1];
            let val = eqMatch[2].trim();

            if (val.endsWith('{')) {
                const objKey = val.slice(0, -1).trim();
                if (objKey === '') {
                    current[key] = {};
                    stack.push({ obj: current[key], indent: indent });
                } else {
                    current[key] = parseGomlValue(val.replace(/\{$/, '').trim());
                }
            } else if (val === '}') {
                continue;
            } else {
                current[key] = parseGomlValue(val);
            }
            continue;
        }

        if (line === '}') {
            continue;
        }

        const arrMatch = line.match(/^(\w+)\s*=\s*\[(.+)\]$/);
        if (arrMatch) {
            const key = arrMatch[1];
            const items = arrMatch[2];
            current[key] = parseGomlArray(items);
            continue;
        }

        const arrStartMatch = line.match(/^(\w+)\s*=\s*\[$/);
        if (arrStartMatch) {
            const key = arrStartMatch[1];
            current[key] = [];
            arrayContext = { key, arr: current[key], parent: current };
            continue;
        }

        if (line === ']' && arrayContext) {
            arrayContext = null;
            continue;
        }

        if (arrayContext) {
            const objMatch = line.match(/^\{$/) || line.match(/^(\w+)\s*\{$/);
            if (objMatch || line === '{') {
                const newObj = {};
                arrayContext.arr.push(newObj);
                stack.push({ obj: newObj, indent: indent });
                continue;
            }
        }
    }

    return root;
}

function parseGomlValue(val) {
    val = val.trim();

    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null' || val === '~') return null;

    if ((val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))) {
        return val.slice(1, -1);
    }

    if (/^-?\d+$/.test(val)) return parseInt(val, 10);
    if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);

    if (val.startsWith('$')) {
        return { __ref__: val.slice(1) };
    }

    if (val.startsWith('[') && val.endsWith(']')) {
        return parseGomlArray(val.slice(1, -1));
    }

    return val;
}

function parseGomlArray(items) {
    if (!items.trim()) return [];

    const result = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < items.length; i++) {
        const ch = items[i];
        if (ch === '{' || ch === '[') depth++;
        if (ch === '}' || ch === ']') depth--;
        if (ch === ',' && depth === 0) {
            result.push(parseGomlValue(current.trim()));
            current = '';
        } else {
            current += ch;
        }
    }

    if (current.trim()) {
        result.push(parseGomlValue(current.trim()));
    }

    return result;
}

function jsonToGoml(obj, indent = 0) {
    let output = '';
    const prefix = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
            output += `${prefix}${key} = ~\n`;
        } else if (typeof value === 'boolean') {
            output += `${prefix}${key} = ${value}\n`;
        } else if (typeof value === 'number') {
            output += `${prefix}${key} = ${value}\n`;
        } else if (typeof value === 'string') {
            if (value.includes(' ') || value.includes('#') || value.includes('//')) {
                output += `${prefix}${key} = "${value}"\n`;
            } else {
                output += `${prefix}${key} = ${value}\n`;
            }
        } else if (Array.isArray(value)) {
            if (value.length === 0) {
                output += `${prefix}${key} = []\n`;
            } else if (value.every(v => typeof v !== 'object' || v === null)) {
                const items = value.map(v => formatArrayValue(v)).join(', ');
                output += `${prefix}${key} = [${items}]\n`;
            } else {
                output += `${prefix}${key} = [\n`;
                value.forEach((item, i) => {
                    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                        output += `${prefix}  {\n`;
                        output += jsonToGoml(item, indent + 2).trimEnd() + '\n';
                        output += `${prefix}  }`;
                    } else {
                        output += `${prefix}  ${formatArrayValue(item)}`;
                    }
                    if (i < value.length - 1) output += ',';
                    output += '\n';
                });
                output += `${prefix}]\n`;
            }
        } else if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) {
                output += `${prefix}${key} {}\n`;
            } else {
                output += `${prefix}${key} {\n`;
                output += jsonToGoml(value, indent + 1);
                output += `${prefix}}\n`;
            }
        }
    }

    return output;
}

function formatArrayValue(val) {
    if (val === null || val === undefined) return '~';
    if (typeof val === 'boolean') return String(val);
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
        if (val.includes(' ') || val.includes('#') || val.includes('//')) {
            return `"${val}"`;
        }
        return val;
    }
    if (Array.isArray(val)) {
        const items = val.map(v => formatArrayValue(v)).join(', ');
        return `[${items}]`;
    }
    if (typeof val === 'object') {
        let obj = '{ ';
        const entries = Object.entries(val);
        entries.forEach(([k, v], i) => {
            obj += `${k} = ${formatArrayValue(v)}`;
            if (i < entries.length - 1) obj += ', ';
        });
        obj += ' }';
        return obj;
    }
    return String(val);
}

function initNavScroll() {
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            nav.style.borderBottomColor = 'var(--border)';
        } else {
            nav.style.borderBottomColor = 'transparent';
        }

        lastScroll = currentScroll;
    });
}
