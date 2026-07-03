const STORAGE_KEY = 'catatan-pengeluaran-data';
const CATEGORY_STORAGE_KEY = 'catatan-pengeluaran-categories';
const BUDGET_STORAGE_KEY = 'catatan-pengeluaran-budgets';
const BUDGET_TOTAL_VALUE = '__total__';
const ADD_CATEGORY_VALUE = '__add_new__';
const DELETE_CATEGORY_VALUE = '__delete_category__';

const DEFAULT_CATEGORIES = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Tagihan',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
    'Lainnya'
];

const categoryColors = {
    'Makanan & Minuman': 1,
    'Transportasi': 2,
    'Belanja': 3,
    'Tagihan': 4,
    'Hiburan': 5,
    'Kesehatan': 6,
    'Pendidikan': 7,
    'Lainnya': 8
};

let expenses = [];
let customCategories = [];
let editingId = null;
let activeMonth = null;
let budgets = { total: null, categories: {} };

function loadExpenses() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        expenses = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading expenses:', e);
        expenses = [];
    }
}

function saveExpenses() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (e) {
        console.error('Error saving expenses:', e);
        alert('Gagal menyimpan data. Storage mungkin penuh.');
    }
}

function loadCategories() {
    try {
        const data = localStorage.getItem(CATEGORY_STORAGE_KEY);
        customCategories = data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading categories:', e);
        customCategories = [];
    }
}

function saveCategories() {
    try {
        localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(customCategories));
    } catch (e) {
        console.error('Error saving categories:', e);
        alert('Gagal menyimpan kategori. Storage mungkin penuh.');
    }
}

function getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...customCategories];
}

function loadBudgets() {
    try {
        const data = localStorage.getItem(BUDGET_STORAGE_KEY);
        const parsed = data ? JSON.parse(data) : null;
        budgets = {
            total: parsed && typeof parsed.total === 'number' ? parsed.total : null,
            categories: parsed && typeof parsed.categories === 'object' && parsed.categories !== null
                ? parsed.categories
                : {}
        };
    } catch (e) {
        console.error('Error loading budgets:', e);
        budgets = { total: null, categories: {} };
    }
}

function saveBudgets() {
    try {
        localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    } catch (e) {
        console.error('Error saving budgets:', e);
        alert('Gagal menyimpan anggaran. Storage mungkin penuh.');
    }
}

function setBudget(target, amount) {
    if (target === BUDGET_TOTAL_VALUE) {
        budgets.total = amount;
    } else {
        budgets.categories[target] = amount;
    }
    saveBudgets();
    refreshViews();
}

function deleteBudget(target) {
    if (target === BUDGET_TOTAL_VALUE) {
        budgets.total = null;
    } else {
        delete budgets.categories[target];
    }
    saveBudgets();
    refreshViews();
}

function getCategoryBadgeNumber(category) {
    if (categoryColors[category]) {
        return categoryColors[category];
    }
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = (hash * 31 + category.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) % 8) + 1;
}

function populateCategorySelects(selectedInputValue = '') {
    const categories = getAllCategories();
    const inputSelect = document.getElementById('inputCategory');
    const filterSelect = document.getElementById('filterCategory');
    const previousFilterValue = filterSelect.value;

    const optionsHtml = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    const deleteOptionHtml = customCategories.length > 0
        ? `<option value="${DELETE_CATEGORY_VALUE}">🗑 Hapus kategori...</option>`
        : '';

    inputSelect.innerHTML = '<option value="">Pilih Kategori</option>' + optionsHtml +
        `<option value="${ADD_CATEGORY_VALUE}">+ Tambah kategori baru...</option>` + deleteOptionHtml;
    inputSelect.value = selectedInputValue;

    filterSelect.innerHTML = '<option value="">Semua Kategori</option>' + optionsHtml;
    if (categories.includes(previousFilterValue)) {
        filterSelect.value = previousFilterValue;
    }

    const budgetSelect = document.getElementById('budgetTarget');
    const previousBudgetValue = budgetSelect.value;
    budgetSelect.innerHTML = `<option value="${BUDGET_TOTAL_VALUE}">Total Bulanan</option>` + optionsHtml;
    if (categories.includes(previousBudgetValue)) {
        budgetSelect.value = previousBudgetValue;
    }
}

function addCustomCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) {
        return null;
    }
    if (getAllCategories().includes(trimmed)) {
        return trimmed;
    }
    customCategories.push(trimmed);
    saveCategories();
    return trimmed;
}

function deleteCustomCategory(name) {
    customCategories = customCategories.filter(c => c !== name);
    saveCategories();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getYearMonth(dateString) {
    return dateString.substring(0, 7);
}

function getCurrentMonth() {
    return getYearMonth(getTodayString());
}

function shiftMonth(yearMonth, delta) {
    const [year, month] = yearMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric'
    }).format(new Date(year, month - 1, 1));
}

function setActiveMonth(yearMonth) {
    activeMonth = yearMonth;
    refreshViews();
}

function refreshViews() {
    renderMonthNav();
    renderList(document.getElementById('filterCategory').value);
    renderSummary();
    renderCategoryStats();
    renderTrend();
    renderBudgetList();
}

function renderMonthNav() {
    const isCurrentMonth = activeMonth === getCurrentMonth();
    document.getElementById('monthLabel').textContent = formatMonth(activeMonth);
    document.getElementById('nextMonthBtn').disabled = activeMonth >= getCurrentMonth();
    document.getElementById('currentMonthBtn').classList.toggle('hidden', isCurrentMonth);
}

function addExpense(date, category, amount, note) {
    const expense = {
        id: Date.now(),
        date: date,
        category: category,
        amount: parseFloat(amount),
        note: note.trim()
    };
    expenses.push(expense);
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveExpenses();
    activeMonth = getYearMonth(expense.date);
    refreshViews();
}

function updateExpense(id, date, category, amount, note) {
    const expense = expenses.find(e => e.id === id);
    if (!expense) {
        return;
    }
    expense.date = date;
    expense.category = category;
    expense.amount = parseFloat(amount);
    expense.note = note.trim();
    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveExpenses();
    activeMonth = getYearMonth(expense.date);
    refreshViews();
}

function deleteExpense(id) {
    expenses = expenses.filter(e => e.id !== id);
    saveExpenses();
    refreshViews();
}

function enterEditMode(expense) {
    editingId = expense.id;
    document.getElementById('inputDate').value = expense.date;
    populateCategorySelects(expense.category);
    document.getElementById('inputAmount').value = expense.amount;
    document.getElementById('inputNote').value = expense.note;
    document.getElementById('submitBtn').textContent = 'Simpan Perubahan';
    document.getElementById('cancelEditBtn').classList.remove('hidden');
    document.querySelector('.input-section').classList.add('editing');
    document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('inputAmount').focus();
}

function exitEditMode() {
    editingId = null;
    document.getElementById('expenseForm').reset();
    populateCategorySelects('');
    setDefaultDate();
    document.getElementById('submitBtn').textContent = 'Tambah Pengeluaran';
    document.getElementById('cancelEditBtn').classList.add('hidden');
    document.querySelector('.input-section').classList.remove('editing');
}

function renderSummary() {
    const today = getTodayString();
    const isCurrentMonth = activeMonth === getCurrentMonth();

    const todayExpenses = expenses.filter(e => e.date === today);
    const monthExpenses = expenses.filter(e => getYearMonth(e.date) === activeMonth);

    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    document.getElementById('todayTotal').textContent = formatCurrency(todayTotal);
    document.getElementById('monthTotal').textContent = formatCurrency(monthTotal);
    document.getElementById('monthTotalLabel').textContent = isCurrentMonth
        ? 'Total Bulan Ini'
        : `Total ${formatMonth(activeMonth)}`;

    const budgetCard = document.getElementById('budgetCard');
    if (budgets.total !== null) {
        const remaining = budgets.total - monthTotal;
        const remainingEl = document.getElementById('budgetRemaining');
        remainingEl.textContent = formatCurrency(remaining);
        remainingEl.classList.toggle('negative', remaining < 0);
        remainingEl.classList.toggle('warning', remaining >= 0 && monthTotal >= budgets.total * 0.8);
        document.getElementById('budgetNote').textContent = `dari ${formatCurrency(budgets.total)}`;
        budgetCard.classList.remove('hidden');
    } else {
        budgetCard.classList.add('hidden');
    }
}

function renderTrend() {
    const container = document.getElementById('trendChart');
    const currentMonth = getCurrentMonth();

    const months = [];
    for (let i = 5; i >= 0; i--) {
        months.push(shiftMonth(currentMonth, -i));
    }

    const totals = months.map(month =>
        expenses
            .filter(e => getYearMonth(e.date) === month)
            .reduce((sum, e) => sum + e.amount, 0)
    );
    const maxTotal = Math.max(...totals);

    container.innerHTML = months.map((month, i) => {
        const barWidth = maxTotal > 0 ? (totals[i] / maxTotal) * 100 : 0;
        const activeClass = month === activeMonth ? ' active' : '';

        return `
            <div class="stat-row trend-row${activeClass}" data-month="${month}" role="button" tabindex="0">
                <div class="stat-row-header">
                    <span class="stat-category">${formatMonth(month)}</span>
                    <span class="stat-value">${formatCurrency(totals[i])}</span>
                </div>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width: ${barWidth}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderCategoryStats() {
    const container = document.getElementById('categoryStats');
    const isCurrentMonth = activeMonth === getCurrentMonth();
    document.getElementById('statsTitle').textContent = isCurrentMonth
        ? 'Rincian per Kategori (Bulan Ini)'
        : `Rincian per Kategori (${formatMonth(activeMonth)})`;

    const monthExpenses = expenses.filter(e => getYearMonth(e.date) === activeMonth);

    const totals = {};
    monthExpenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    Object.keys(budgets.categories).forEach(category => {
        if (!(category in totals)) {
            totals[category] = 0;
        }
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
        container.innerHTML = '<p class="empty-message">Belum ada pengeluaran bulan ini</p>';
        return;
    }

    const grandTotal = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    const maxAmount = sorted[0][1];

    container.innerHTML = sorted.map(([category, amount]) => {
        const budget = budgets.categories[category];
        let barWidth, barClass = '', valueHtml, noteHtml = '';

        if (typeof budget === 'number') {
            const ratio = amount / budget;
            barWidth = Math.min(ratio * 100, 100);
            valueHtml = `${formatCurrency(amount)} <span class="stat-percent">dari ${formatCurrency(budget)}</span>`;
            if (ratio > 1) {
                barClass = ' over';
                noteHtml = `<div class="stat-budget-note over">Lewat ${formatCurrency(amount - budget)}</div>`;
            } else {
                if (ratio >= 0.8) {
                    barClass = ' warn';
                }
                noteHtml = `<div class="stat-budget-note">Sisa ${formatCurrency(budget - amount)}</div>`;
            }
        } else {
            const percent = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
            const percentLabel = percent < 1 ? '<1%' : `${Math.round(percent)}%`;
            barWidth = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
            valueHtml = `${formatCurrency(amount)} <span class="stat-percent">(${percentLabel})</span>`;
        }

        return `
            <div class="stat-row">
                <div class="stat-row-header">
                    <span class="stat-category">${escapeHtml(category)}</span>
                    <span class="stat-value">${valueHtml}</span>
                </div>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill${barClass}" style="width: ${barWidth}%"></div>
                </div>
                ${noteHtml}
            </div>
        `;
    }).join('');
}

function renderBudgetList() {
    const container = document.getElementById('budgetList');
    const items = [];

    if (budgets.total !== null) {
        items.push({ target: BUDGET_TOTAL_VALUE, label: 'Total Bulanan', amount: budgets.total });
    }
    Object.entries(budgets.categories).forEach(([category, amount]) => {
        items.push({ target: category, label: category, amount: amount });
    });

    if (items.length === 0) {
        container.innerHTML = '<p class="empty-message">Belum ada anggaran. Atur batas belanja agar pengeluaran lebih terkontrol.</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="budget-item">
            <span class="budget-item-label">${escapeHtml(item.label)}</span>
            <span class="budget-item-amount">${formatCurrency(item.amount)}</span>
            <button class="btn-danger" data-budget-target="${escapeHtml(item.target)}">Hapus</button>
        </div>
    `).join('');
}

function renderList(filterCategory = '') {
    const listContainer = document.getElementById('expenseList');
    let filteredExpenses = expenses.filter(e => getYearMonth(e.date) === activeMonth);

    if (filterCategory) {
        filteredExpenses = filteredExpenses.filter(e => e.category === filterCategory);
    }

    if (filteredExpenses.length === 0) {
        listContainer.innerHTML = `<p class="empty-message">Belum ada catatan pengeluaran di ${formatMonth(activeMonth)}</p>`;
        return;
    }

    listContainer.innerHTML = filteredExpenses.map(expense => {
        const badgeClass = `badge-${getCategoryBadgeNumber(expense.category)}`;
        const noteHtml = expense.note ? `<p class="expense-note">${escapeHtml(expense.note)}</p>` : '';

        return `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-item-left">
                    <div class="expense-date">${formatDate(expense.date)}</div>
                    <span class="expense-category-badge ${badgeClass}">${escapeHtml(expense.category)}</span>
                    ${noteHtml}
                </div>
                <div class="expense-item-middle">
                    <div class="expense-amount">${formatCurrency(expense.amount)}</div>
                </div>
                <div class="expense-item-right">
                    <button class="btn-edit" data-edit-id="${expense.id}">Edit</button>
                    <button class="btn-danger" data-delete-id="${expense.id}">Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ===== Backup & Export ===== */

let pendingImport = null;

function buildExportJson() {
    return JSON.stringify({
        version: 1,
        exportedAt: new Date().toISOString(),
        expenses: expenses,
        customCategories: customCategories,
        budgets: budgets
    }, null, 2);
}

function escapeCsvField(value) {
    const text = String(value);
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function buildExportCsv() {
    const header = 'tanggal,kategori,jumlah,catatan';
    const rows = expenses.map(e =>
        [e.date, e.category, e.amount, e.note || ''].map(escapeCsvField).join(',')
    );
    return '\uFEFF' + [header, ...rows].join('\r\n');
}

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function showDataMessage(text, isError = false) {
    const el = document.getElementById('dataMessage');
    el.textContent = text;
    el.classList.toggle('error', isError);
    el.classList.remove('hidden');
}

function validateImportData(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.expenses)) {
        return null;
    }

    const validExpenses = [];
    for (const item of data.expenses) {
        if (!item || typeof item !== 'object') return null;
        if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return null;
        if (typeof item.category !== 'string' || !item.category) return null;
        if (typeof item.amount !== 'number' || !isFinite(item.amount) || item.amount <= 0) return null;

        validExpenses.push({
            id: typeof item.id === 'number' ? item.id : Date.now() + Math.floor(Math.random() * 1000000),
            date: item.date,
            category: item.category,
            amount: item.amount,
            note: typeof item.note === 'string' ? item.note : ''
        });
    }

    const validCategories = Array.isArray(data.customCategories)
        ? data.customCategories.filter(c => typeof c === 'string' && c.trim())
        : [];

    const validBudgets = { total: null, categories: {} };
    if (data.budgets && typeof data.budgets === 'object') {
        if (typeof data.budgets.total === 'number' && data.budgets.total > 0) {
            validBudgets.total = data.budgets.total;
        }
        if (data.budgets.categories && typeof data.budgets.categories === 'object') {
            Object.entries(data.budgets.categories).forEach(([cat, amt]) => {
                if (typeof amt === 'number' && amt > 0) {
                    validBudgets.categories[cat] = amt;
                }
            });
        }
    }

    return { expenses: validExpenses, customCategories: validCategories, budgets: validBudgets };
}

function applyImport(mode) {
    if (!pendingImport) {
        return;
    }

    if (mode === 'replace') {
        expenses = pendingImport.expenses;
        customCategories = pendingImport.customCategories;
        budgets = pendingImport.budgets;
    } else {
        const existingIds = new Set(expenses.map(e => e.id));
        const newExpenses = pendingImport.expenses.filter(e => !existingIds.has(e.id));
        expenses = expenses.concat(newExpenses);

        pendingImport.customCategories.forEach(c => {
            if (!getAllCategories().includes(c)) {
                customCategories.push(c);
            }
        });

        if (budgets.total === null) {
            budgets.total = pendingImport.budgets.total;
        }
        Object.entries(pendingImport.budgets.categories).forEach(([cat, amt]) => {
            if (!(cat in budgets.categories)) {
                budgets.categories[cat] = amt;
            }
        });
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveExpenses();
    saveCategories();
    saveBudgets();

    const count = pendingImport.expenses.length;
    cancelImport();
    populateCategorySelects();
    refreshViews();
    showDataMessage(`Import berhasil: ${count} transaksi diproses.`);
}

function cancelImport() {
    pendingImport = null;
    document.getElementById('importConfirm').classList.add('hidden');
    document.getElementById('importFileInput').value = '';
}

function handleImportFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        let parsed;
        try {
            parsed = JSON.parse(reader.result);
        } catch (e) {
            showDataMessage('File bukan JSON yang valid.', true);
            cancelImport();
            return;
        }

        const validated = validateImportData(parsed);
        if (!validated) {
            showDataMessage('Struktur file tidak dikenali. Gunakan file hasil Export JSON dari aplikasi ini.', true);
            cancelImport();
            return;
        }

        pendingImport = validated;
        const budgetCount = (validated.budgets.total !== null ? 1 : 0)
            + Object.keys(validated.budgets.categories).length;
        document.getElementById('importSummary').textContent =
            `File berisi ${validated.expenses.length} transaksi, ${validated.customCategories.length} kategori kustom, dan ${budgetCount} anggaran. ` +
            'Gabungkan dengan data sekarang, atau ganti semua data?';
        document.getElementById('importConfirm').classList.remove('hidden');
        document.getElementById('dataMessage').classList.add('hidden');
    };
    reader.onerror = () => {
        showDataMessage('Gagal membaca file.', true);
        cancelImport();
    };
    reader.readAsText(file);
}

function setDefaultDate() {
    const dateInput = document.getElementById('inputDate');
    dateInput.valueAsDate = new Date();
}

function initEventListeners() {
    const form = document.getElementById('expenseForm');

    const inputCategory = document.getElementById('inputCategory');
    inputCategory.addEventListener('change', (e) => {
        if (e.target.value === ADD_CATEGORY_VALUE) {
            const name = prompt('Masukkan nama kategori baru:');
            if (name === null) {
                populateCategorySelects('');
                return;
            }

            const added = addCustomCategory(name);
            populateCategorySelects(added || '');
            return;
        }

        if (e.target.value === DELETE_CATEGORY_VALUE) {
            if (customCategories.length === 0) {
                alert('Belum ada kategori kustom yang bisa dihapus');
                populateCategorySelects('');
                return;
            }

            const list = customCategories.map((c, i) => `${i + 1}. ${c}`).join('\n');
            const answer = prompt(`Masukkan nomor kategori yang ingin dihapus:\n${list}`);
            if (answer === null) {
                populateCategorySelects('');
                return;
            }

            const index = parseInt(answer, 10) - 1;
            if (isNaN(index) || index < 0 || index >= customCategories.length) {
                alert('Pilihan tidak valid');
                populateCategorySelects('');
                return;
            }

            const target = customCategories[index];
            if (confirm(`Hapus kategori "${target}"? Pengeluaran yang sudah tercatat dengan kategori ini tidak akan terhapus.`)) {
                deleteCustomCategory(target);
            }
            populateCategorySelects('');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const date = document.getElementById('inputDate').value;
        const category = document.getElementById('inputCategory').value;
        const amount = document.getElementById('inputAmount').value;
        const note = document.getElementById('inputNote').value;

        if (!date || !category || category === ADD_CATEGORY_VALUE || category === DELETE_CATEGORY_VALUE || !amount) {
            alert('Harap isi semua field yang diperlukan');
            return;
        }

        if (parseFloat(amount) <= 0) {
            alert('Jumlah harus lebih besar dari 0');
            return;
        }

        if (editingId !== null) {
            updateExpense(editingId, date, category, amount, note);
            exitEditMode();
        } else {
            addExpense(date, category, amount, note);
            form.reset();
            setDefaultDate();
        }
        document.getElementById('inputCategory').focus();
    });

    document.getElementById('cancelEditBtn').addEventListener('click', exitEditMode);

    document.getElementById('budgetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const target = document.getElementById('budgetTarget').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);

        if (!target || isNaN(amount) || amount <= 0) {
            alert('Harap isi batas anggaran yang valid');
            return;
        }

        setBudget(target, amount);
        document.getElementById('budgetAmount').value = '';
    });

    document.getElementById('budgetList').addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('[data-budget-target]');
        if (deleteBtn) {
            deleteBudget(deleteBtn.dataset.budgetTarget);
        }
    });

    document.getElementById('exportJsonBtn').addEventListener('click', () => {
        downloadFile(`catatan-pengeluaran-${getTodayString()}.json`, buildExportJson(), 'application/json');
        showDataMessage('Backup JSON diunduh.');
    });

    document.getElementById('exportCsvBtn').addEventListener('click', () => {
        downloadFile(`catatan-pengeluaran-${getTodayString()}.csv`, buildExportCsv(), 'text/csv;charset=utf-8');
        showDataMessage('File CSV diunduh.');
    });

    document.getElementById('importJsonBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    document.getElementById('importFileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImportFile(e.target.files[0]);
        }
    });

    document.getElementById('importMergeBtn').addEventListener('click', () => applyImport('merge'));
    document.getElementById('importReplaceBtn').addEventListener('click', () => applyImport('replace'));
    document.getElementById('importCancelBtn').addEventListener('click', cancelImport);

    const filterSelect = document.getElementById('filterCategory');
    filterSelect.addEventListener('change', (e) => {
        renderList(e.target.value);
    });

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        setActiveMonth(shiftMonth(activeMonth, -1));
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        if (activeMonth < getCurrentMonth()) {
            setActiveMonth(shiftMonth(activeMonth, 1));
        }
    });

    document.getElementById('currentMonthBtn').addEventListener('click', () => {
        setActiveMonth(getCurrentMonth());
    });

    const trendChart = document.getElementById('trendChart');
    trendChart.addEventListener('click', (e) => {
        const row = e.target.closest('.trend-row');
        if (row) {
            setActiveMonth(row.dataset.month);
        }
    });
    trendChart.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const row = e.target.closest('.trend-row');
            if (row) {
                e.preventDefault();
                setActiveMonth(row.dataset.month);
            }
        }
    });

    const expenseList = document.getElementById('expenseList');
    expenseList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = parseInt(editBtn.dataset.editId);
            const expense = expenses.find(exp => exp.id === id);
            if (expense) {
                enterEditMode(expense);
            }
            return;
        }

        const deleteBtn = e.target.closest('.btn-danger');
        if (deleteBtn) {
            const id = parseInt(deleteBtn.dataset.deleteId);
            if (confirm('Apakah Anda yakin ingin menghapus pengeluaran ini?')) {
                if (id === editingId) {
                    exitEditMode();
                }
                deleteExpense(id);
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    activeMonth = getCurrentMonth();
    loadExpenses();
    loadCategories();
    loadBudgets();
    populateCategorySelects();
    setDefaultDate();
    initEventListeners();
    refreshViews();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(e => {
            console.error('Service worker gagal terdaftar:', e);
        });
    }
});
