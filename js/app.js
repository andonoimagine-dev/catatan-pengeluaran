const STORAGE_KEY = 'catatan-pengeluaran-data';
const CATEGORY_STORAGE_KEY = 'catatan-pengeluaran-categories';
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

function refreshViews() {
    renderList(document.getElementById('filterCategory').value);
    renderSummary();
    renderCategoryStats();
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
    const currentMonth = getYearMonth(today);

    const todayExpenses = expenses.filter(e => e.date === today);
    const monthExpenses = expenses.filter(e => getYearMonth(e.date) === currentMonth);

    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    document.getElementById('todayTotal').textContent = formatCurrency(todayTotal);
    document.getElementById('monthTotal').textContent = formatCurrency(monthTotal);
}

function renderCategoryStats() {
    const container = document.getElementById('categoryStats');
    const currentMonth = getYearMonth(getTodayString());
    const monthExpenses = expenses.filter(e => getYearMonth(e.date) === currentMonth);

    if (monthExpenses.length === 0) {
        container.innerHTML = '<p class="empty-message">Belum ada pengeluaran bulan ini</p>';
        return;
    }

    const totals = {};
    monthExpenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const grandTotal = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    const maxAmount = sorted[0][1];

    container.innerHTML = sorted.map(([category, amount]) => {
        const percent = grandTotal > 0 ? (amount / grandTotal) * 100 : 0;
        const barWidth = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
        const percentLabel = percent < 1 ? '<1%' : `${Math.round(percent)}%`;

        return `
            <div class="stat-row">
                <div class="stat-row-header">
                    <span class="stat-category">${escapeHtml(category)}</span>
                    <span class="stat-value">${formatCurrency(amount)} <span class="stat-percent">(${percentLabel})</span></span>
                </div>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width: ${barWidth}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderList(filterCategory = '') {
    const listContainer = document.getElementById('expenseList');
    let filteredExpenses = expenses;

    if (filterCategory) {
        filteredExpenses = expenses.filter(e => e.category === filterCategory);
    }

    if (filteredExpenses.length === 0) {
        listContainer.innerHTML = '<p class="empty-message">Belum ada catatan pengeluaran</p>';
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

    const filterSelect = document.getElementById('filterCategory');
    filterSelect.addEventListener('change', (e) => {
        renderList(e.target.value);
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
    loadExpenses();
    loadCategories();
    populateCategorySelects();
    setDefaultDate();
    renderList();
    renderSummary();
    renderCategoryStats();
    initEventListeners();
});
