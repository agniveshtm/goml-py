// ============================================================
// GOML Parser (simplified for browser)
// ============================================================

function parseGOML(input) {
    const lines = input.split('\n');
    const root = {};
    const stack = [{ obj: root, indent: -1 }];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) continue;

        const indent = lines[i].search(/\S/);
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
        const current = stack[stack.length - 1].obj;

        // Block start: key {
        const braceMatch = line.match(/^(\w+)\s*\{$/);
        if (braceMatch) {
            current[braceMatch[1]] = {};
            stack.push({ obj: current[braceMatch[1]], indent });
            continue;
        }

        // Closing brace
        if (line === '}') continue;

        // Array start: key [
        const arrStartMatch = line.match(/^(\w+)\s*\[$/);
        if (arrStartMatch) {
            current[arrStartMatch[1]] = [];
            stack.push({ obj: current, indent, arrKey: arrStartMatch[1] });
            continue;
        }

        // Array item start
        if (line === '{' && stack[stack.length - 1].arrKey) {
            const newObj = {};
            const arrKey = stack[stack.length - 1].arrKey;
            current[arrKey].push(newObj);
            stack.push({ obj: newObj, indent });
            continue;
        }

        // Array end
        if (line === ']') {
            if (stack.length > 1) stack.pop();
            continue;
        }

        // Key = value
        const eqMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
        if (eqMatch) {
            const key = eqMatch[1];
            let val = eqMatch[2].trim();

            if (val === '[') {
                current[key] = [];
                stack.push({ obj: current, indent, arrKey: key });
            } else if (val.endsWith(']')) {
                current[key] = parseArray(val.slice(0, -1));
            } else {
                current[key] = parseValue(val);
            }
            continue;
        }

        // Inline object in array: { key = val, key = val }
        if (line.startsWith('{') && line.endsWith('}')) {
            const content = line.slice(1, -1);
            const obj = {};
            content.split(',').forEach(pair => {
                const [k, v] = pair.split('=').map(s => s.trim());
                if (k && v) obj[k] = parseValue(v);
            });
            if (stack[stack.length - 1].arrKey) {
                const arrKey = stack[stack.length - 1].arrKey;
                current[arrKey].push(obj);
            }
            continue;
        }
    }

    return root;
}

function parseValue(val) {
    val = val.trim();
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (val === 'null' || val === '~') return null;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        return val.slice(1, -1);
    if (/^-?\d+$/.test(val)) return parseInt(val, 10);
    if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
    if (val.startsWith('$')) return { __ref__: val.slice(1) };
    return val;
}

function parseArray(items) {
    if (!items.trim()) return [];
    return items.split(',').map(v => parseValue(v.trim()));
}

// ============================================================
// GOML Serializer
// ============================================================

function toGOML(data, indent = 0) {
    const pad = '  '.repeat(indent);
    let output = '';

    if (data === null) return 'null';
    if (typeof data === 'boolean') return data.toString();
    if (typeof data === 'number') return data.toString();
    if (typeof data === 'string') return needsQuote(data) ? `"${data}"` : data;
    if (Array.isArray(data)) {
        if (data.length === 0) return '[]';
        if (data.every(x => typeof x !== 'object')) {
            return '[' + data.join(', ') + ']';
        }
        output += '[\n';
        data.forEach((item, i) => {
            output += pad + '  {\n';
            Object.entries(item).forEach(([k, v]) => {
                if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                    output += pad + '    ' + k + ' {\n';
                    Object.entries(v).forEach(([k2, v2]) => {
                        output += pad + '      ' + k2 + ' = ' + toGOML(v2, indent + 4) + '\n';
                    });
                    output += pad + '    }\n';
                } else {
                    output += pad + '    ' + k + ' = ' + toGOML(v, indent + 2) + '\n';
                }
            });
            output += pad + '  }' + (i < data.length - 1 ? '\n' : '\n');
        });
        output += pad + ']';
        return output;
    }
    if (typeof data === 'object') {
        const keys = Object.keys(data).sort();
        if (keys.length === 0) return '{}';
        output += '{\n';
        keys.forEach(k => {
            output += pad + '  ' + k + ' = ' + toGOML(data[k], indent + 1) + '\n';
        });
        output += pad + '}';
        return output;
    }
    return String(data);
}

function needsQuote(s) {
    if (!s) return true;
    if (s === 'true' || s === 'false' || s === 'null') return true;
    if (/^[\d.]/.test(s)) return true;
    return /[\s,{}[\]="']/.test(s);
}

// ============================================================
// App State
// ============================================================

const STORAGE_KEY = 'budget_goml_data';
let data = { settings: {}, categories: [], transactions: [] };
let nextId = 1;

const categoryIcons = {
    Food: '🍕', Transport: '🚗', Entertainment: '🎬', Bills: '⚡',
    Shopping: '🛍️', Health: '💊', Income: '💰', Other: '📦'
};

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setDefaultDate();
    renderAll();
});

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch (e) {
            loadDefaultData();
        }
    } else {
        loadDefaultData();
    }
    nextId = Math.max(0, ...data.transactions.map(t => t.id)) + 1;
}

function loadDefaultData() {
    const gomlData = `# Budget Tracker Data
settings {
  currency = USD
  monthly_budget = 3000
}

categories [
  { name = Food, color = #ff6b6b }
  { name = Transport, color = #4ecdc4 }
  { name = Entertainment, color = #a855f7 }
  { name = Bills, color = #f59e0b }
  { name = Shopping, color = #ec4899 }
  { name = Health, color = #10b981 }
  { name = Income, color = #22c55e }
]

transactions [
  { id = 1, description = Salary, amount = 5000, category = Income, date = 2024-01-01, type = income }
  { id = 2, description = Grocery Store, amount = 85.50, category = Food, date = 2024-01-03, type = expense }
  { id = 3, description = Netflix, amount = 15.99, category = Entertainment, date = 2024-01-05, type = expense }
  { id = 4, description = Electric Bill, amount = 120, category = Bills, date = 2024-01-07, type = expense }
  { id = 5, description = Uber Ride, amount = 25, category = Transport, date = 2024-01-10, type = expense }
]`;
    data = parseGOML(gomlData);
    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setDefaultDate() {
    document.getElementById('date').valueAsDate = new Date();
}

// ============================================================
// Rendering
// ============================================================

let currentPreview = 'goml';

function renderAll() {
    renderStats();
    renderTransactions();
    renderCategories();
    renderPreview();
    updateFilters();
}

function renderStats() {
    const income = data.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const expenses = data.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    const budget = (data.settings.monthly_budget || 3000) - expenses;

    document.getElementById('totalIncome').textContent = formatMoney(income);
    document.getElementById('totalExpenses').textContent = formatMoney(expenses);
    document.getElementById('balance').textContent = formatMoney(balance);
    document.getElementById('budgetLeft').textContent = formatMoney(budget);
}

function renderTransactions() {
    const list = document.getElementById('transactionsList');
    const filterCat = document.getElementById('filterCategory').value;
    const filterType = document.getElementById('filterType').value;

    let filtered = data.transactions;
    if (filterCat !== 'all') filtered = filtered.filter(t => t.category === filterCat);
    if (filterType !== 'all') filtered = filtered.filter(t => t.type === filterType);

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><h3>No transactions</h3><p>Add your first transaction</p></div>';
        return;
    }

    list.innerHTML = filtered.map(t => {
        const cat = data.categories.find(c => c.name === t.category) || {};
        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-cat" style="background:${cat.color || '#666'}22;color:${cat.color || '#666'}">
                        ${categoryIcons[t.category] || '📦'}
                    </div>
                    <div class="transaction-details">
                        <h4>${escapeHtml(t.description)}</h4>
                        <span>${t.category} • ${formatDate(t.date)}</span>
                    </div>
                </div>
                <div class="transaction-amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="action-btn" onclick="editTransaction(${t.id})">✎</button>
                    <button class="action-btn delete" onclick="deleteTransaction(${t.id})">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategories() {
    const list = document.getElementById('categoryList');
    const expenses = data.transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);

    const byCategory = {};
    expenses.forEach(t => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    list.innerHTML = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amount]) => {
            const catData = data.categories.find(c => c.name === cat) || {};
            const pct = total > 0 ? (amount / total * 100) : 0;
            return `
                <div class="category-item">
                    <div class="category-dot" style="background:${catData.color || '#666'}"></div>
                    <div class="category-info">
                        <div class="category-name">${cat}</div>
                        <div class="category-count">${pct.toFixed(1)}% of expenses</div>
                    </div>
                    <div class="category-amount">${formatMoney(amount)}</div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width:${pct}%;background:${catData.color || '#666'}"></div>
                    </div>
                </div>
            `;
        }).join('');
}

function renderPreview() {
    const el = document.getElementById('dataPreview');
    if (currentPreview === 'goml') {
        el.textContent = toGOML(data);
    } else {
        el.textContent = JSON.stringify(data, null, 2);
    }
}

function showPreview(format) {
    currentPreview = format;
    document.querySelectorAll('.preview-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderPreview();
}

function copyPreview() {
    const text = currentPreview === 'goml' ? toGOML(data) : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    alert(currentPreview.toUpperCase() + ' data copied!');
}

function updateFilters() {
    const select = document.getElementById('filterCategory');
    const current = select.value;
    select.innerHTML = '<option value="all">All Categories</option>';
    data.categories.forEach(c => {
        select.innerHTML += `<option value="${c.name}" ${current === c.name ? 'selected' : ''}>${c.name}</option>`;
    });

    const catSelect = document.getElementById('category');
    catSelect.innerHTML = '';
    data.categories.forEach(c => {
        catSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    });
}

// ============================================================
// CRUD Operations
// ============================================================

function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('editId').value = '';
    document.getElementById('transactionForm').reset();
    setDefaultDate();
    document.getElementById('transactionModal').classList.add('active');
}

function editTransaction(id) {
    const t = data.transactions.find(x => x.id === id);
    if (!t) return;
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('editId').value = id;
    document.getElementById('description').value = t.description;
    document.getElementById('amount').value = t.amount;
    document.getElementById('category').value = t.category;
    document.getElementById('type').value = t.type;
    document.getElementById('date').value = t.date;
    document.getElementById('transactionModal').classList.add('active');
}

function closeModal() {
    document.getElementById('transactionModal').classList.remove('active');
}

function saveTransaction(e) {
    e.preventDefault();
    const editId = document.getElementById('editId').value;
    const transaction = {
        id: editId ? parseInt(editId) : nextId++,
        description: document.getElementById('description').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        type: document.getElementById('type').value,
        date: document.getElementById('date').value
    };

    if (editId) {
        const idx = data.transactions.findIndex(t => t.id === parseInt(editId));
        if (idx >= 0) data.transactions[idx] = transaction;
    } else {
        data.transactions.push(transaction);
    }

    saveData();
    closeModal();
    renderAll();
}

function deleteTransaction(id) {
    if (!confirm('Delete this transaction?')) return;
    data.transactions = data.transactions.filter(t => t.id !== id);
    saveData();
    renderAll();
}

// ============================================================
// Import/Export
// ============================================================

function exportGOML() {
    const goml = toGOML(data);
    downloadFile(goml, 'budget.goml', 'text/plain');
}

function exportJSON() {
    const json = JSON.stringify(data, null, 2);
    downloadFile(json, 'budget.json', 'application/json');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function importGOML(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            data = parseGOML(e.target.result);
            nextId = Math.max(0, ...data.transactions.map(t => t.id)) + 1;
            saveData();
            renderAll();
            alert('GOML file imported successfully!');
        } catch (err) {
            alert('Error parsing GOML file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            data = JSON.parse(e.target.result);
            nextId = Math.max(0, ...data.transactions.map(t => t.id)) + 1;
            saveData();
            renderAll();
            alert('JSON file imported successfully!');
        } catch (err) {
            alert('Error parsing JSON file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function copyGOML() {
    navigator.clipboard.writeText(toGOML(data));
    alert('GOML data copied to clipboard!');
}

// ============================================================
// Utilities
// ============================================================

function formatMoney(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
