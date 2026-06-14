document.addEventListener('DOMContentLoaded', () => {
    initCompareTabs();
    initUsecaseTabs();
    initPlayground();
    initNavScroll();
    initMobileNav();
});

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
    const parseBtn = document.getElementById('parse-btn');
    const status = document.getElementById('parse-status');
    const editorTabs = document.querySelectorAll('.editor-tab');
    const gomlPane = document.getElementById('goml-input');
    const jsonPane = document.getElementById('json-output');

    function switchTab(tabIndex) {
        editorTabs.forEach(t => t.classList.remove('active'));
        gomlPane.classList.remove('active');
        jsonPane.classList.remove('active');

        editorTabs[tabIndex].classList.add('active');
        if (tabIndex === 0) {
            gomlPane.classList.add('active');
        } else {
            jsonPane.classList.add('active');
        }
    }

    editorTabs[0].addEventListener('click', () => switchTab(0));
    editorTabs[1].addEventListener('click', () => switchTab(1));

    function updateHighlight() {
        const text = editor.value;
        if (window.highlightGoml) {
            overlayCode.innerHTML = highlightGoml(text);
        } else {
            overlayCode.textContent = text;
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

    parseBtn.addEventListener('click', () => {
        status.textContent = 'Parsing...';
        status.style.color = 'var(--text-muted)';

        setTimeout(() => {
            try {
                const gomlText = editor.value;
                const parsed = parseGoml(gomlText);
                result.textContent = JSON.stringify(parsed, null, 2);
                result.style.color = 'var(--text)';
                status.textContent = 'Parsed successfully';
                status.style.color = 'var(--accent)';
                switchTab(1);
            } catch (e) {
                result.textContent = 'Error: ' + e.message;
                result.style.color = 'var(--red)';
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
