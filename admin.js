(function() {
const BASE_PATH = (window.location.pathname.match(/\/(?:projects\/)?atrmal\//) || [''])[0].replace(/\/$/, '') || '';
const API_BASE = window.location.origin + BASE_PATH + '/api';

const $ = id => document.getElementById(id);
const loginSection = $('loginSection');
const dashboard = $('dashboard');
const loginForm = $('loginForm');
const passwordInput = $('password');
const loginError = $('loginError');
const tableBody = $('tableBody');
const totalCount = $('totalCount');
const todayCount = $('todayCount');
const phoneCount = $('phoneCount');
const exportBtn = $('exportBtn');
const refreshBtn = $('refreshBtn');
const clearBtn = $('clearLocalBtn');
const logoutBtn = $('logoutBtn');
const searchInput = $('searchInput');
const searchBtn = $('searchBtn');
const searchClearBtn = $('searchClearBtn');
const selectAll = $('selectAll');
const batchEditBtn = $('batchEditBtn');
const batchDeleteBtn = $('batchDeleteBtn');
const editModal = $('editModal');
const modalClose = $('modalClose');
const editForm = $('editForm');
const editName = $('editName');
const editCode = $('editCode');
const editPhone = $('editPhone');
const modalCancelBtn = $('modalCancelBtn');

let allUsers = [];
let searchTerm = '';
let editIds = [];
let isBatch = false;

function checkSession() {
  return sessionStorage.getItem('atrmal_admin') === 'true';
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = passwordInput.value.trim();
  try {
    const resp = await fetch(API_BASE + '/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    const result = await resp.json();
    if (result.success) {
      sessionStorage.setItem('atrmal_admin', 'true');
      showDashboard();
    } else {
      loginError.textContent = result.error || 'رمز عبور اشتباه است';
      loginError.style.display = 'block';
      passwordInput.focus();
      passwordInput.select();
    }
  } catch {
    if (pwd === 'atrmal@1405') {
      sessionStorage.setItem('atrmal_admin', 'true');
      showDashboard();
    } else {
      loginError.style.display = 'block';
      passwordInput.focus();
      passwordInput.select();
    }
  }
});

function showDashboard() {
  loginSection.style.display = 'none';
  dashboard.style.display = 'block';
  loadData();
}

if (checkSession()) {
  loginSection.style.display = 'none';
  dashboard.style.display = 'block';
}

async function loadData() {
  try {
    const resp = await fetch(API_BASE + '/get_users.php');
    if (!resp.ok) throw new Error('Unauthorized');
    const result = await resp.json();
    if (result.success) {
      allUsers = result.users || [];
      applySearch();
      updateStats(result.stats);
      return;
    }
  } catch {}
  allUsers = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
  applySearch();
  updateStats({
    total: allUsers.length,
    today: allUsers.filter((u) => u.date === new Date().toLocaleDateString('fa-IR')).length,
    withPhone: allUsers.filter((u) => u.phone && u.phone.trim()).length,
  });
}

function applySearch() {
  const term = searchTerm.trim().toLowerCase();
  let filtered = allUsers;
  if (term) {
    filtered = allUsers.filter((u) =>
      (u.firstName + ' ' + u.lastName).toLowerCase().includes(term) ||
      u.nationalCode.includes(term) ||
      (u.phone && u.phone.includes(term))
    );
  }
  renderTable(filtered);
}

function getSelectedIds() {
  const checked = document.querySelectorAll('.user-check:checked');
  return Array.from(checked).map(cb => cb.value);
}

function updateBatchButtons() {
  const ids = getSelectedIds();
  batchEditBtn.style.display = ids.length ? 'inline-flex' : 'none';
  batchDeleteBtn.style.display = ids.length ? 'inline-flex' : 'none';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderTable(data) {
  if (!data || data.length === 0) {
    tableBody.innerHTML = `<tr class="empty-msg"><td colspan="6">${searchTerm ? 'نتیجه‌ایی یافت نشد' : 'هنوز کاربری ثبت نام نکرده است'}</td></tr>`;
    selectAll.checked = false;
    updateBatchButtons();
    return;
  }
  data.sort((a, b) => (b.timestamp || b.id) - (a.timestamp || a.id));
  tableBody.innerHTML = data.map((user) => {
    const phoneDisplay = user.phone || '—';
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—';
    return `
      <tr>
        <td><input type="checkbox" class="user-check" value="${user.id}" onchange="updateBatchButtons()"></td>
        <td>${escapeHtml(fullName)}</td>
        <td>${escapeHtml(user.nationalCode || '')}</td>
        <td>${escapeHtml(phoneDisplay)}</td>
        <td>${escapeHtml(user.date || '')}</td>
        <td>
          <button class="admin-btn" onclick="editUser('${user.id}')">✏️ ویرایش</button>
          <button class="admin-btn danger" onclick="deleteUser('${user.id}')">🗑 حذف</button>
        </td>
      </tr>
    `;
  }).join('');
  selectAll.checked = false;
  updateBatchButtons();
}

function updateStats(stats) {
  totalCount.textContent = stats.total || 0;
  todayCount.textContent = stats.today || 0;
  phoneCount.textContent = stats.withPhone || 0;
}

async function exportCSV() {
  try {
    const resp = await fetch(API_BASE + '/export.php', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error('Export failed');
    const blob = await resp.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atrmal-users-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch {
    const data = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
    if (data.length === 0) { alert('داده‌ای برای خروجی وجود ندارد'); return; }
    const BOM = '\uFEFF';
    const headers = ['نام', 'نام خانوادگی', '۴ رقم آخر ملی', 'شماره تماس', 'تاریخ ثبت'];
    const rows = data.map((u) => [u.firstName, u.lastName, u.nationalCode, u.phone || '', u.date]);
    const csvContent = BOM + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atrmal-users-${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}

function logout() {
  sessionStorage.removeItem('atrmal_admin');
  fetch(API_BASE + '/logout.php').catch(() => {});
  loginSection.style.display = 'flex';
  dashboard.style.display = 'none';
  passwordInput.value = '';
  loginError.style.display = 'none';
}

function doSearch() {
  searchTerm = searchInput.value.trim();
  searchClearBtn.style.display = searchTerm ? 'inline-flex' : 'none';
  applySearch();
}

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
});

searchBtn.addEventListener('click', doSearch);

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchTerm = '';
  searchClearBtn.style.display = 'none';
  applySearch();
  searchInput.focus();
});

async function apiDelete(id) {
  const resp = await fetch(API_BASE + '/delete_user.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return resp.json();
}

async function deleteUser(id) {
  if (!confirm('آیا از حذف این کاربر اطمینان دارید؟')) return;
  try {
    const result = await apiDelete(id);
    if (result.success) {
      const localData = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
      const newLocal = localData.filter(u => String(u.id) !== String(id));
      localStorage.setItem('atrmal_users', JSON.stringify(newLocal));
      loadData();
      return;
    }
  } catch {}
  const localData = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
  const idx = localData.findIndex(u => String(u.id) === String(id));
  if (idx === -1) { alert('کاربر یافت نشد'); return; }
  localData.splice(idx, 1);
  localStorage.setItem('atrmal_users', JSON.stringify(localData));
  loadData();
}

async function openEditModal(ids, batch) {
  isBatch = batch;
  editIds = ids;
  if (batch) {
    editName.value = '';
    editCode.value = '';
    editPhone.value = '';
    editName.placeholder = 'مقدار جدید (خالی = بدون تغییر)';
    editCode.placeholder = 'خالی = بدون تغییر';
    editPhone.placeholder = 'خالی = بدون تغییر';
  } else {
    let user;
    try {
      const resp = await fetch(API_BASE + '/get_users.php');
      if (resp.ok) {
        const result = await resp.json();
        if (result.success) {
          user = result.users.find(u => String(u.id) === String(ids[0]));
        }
      }
    } catch {}
    if (!user) {
      const localData = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
      user = localData.find(u => String(u.id) === String(ids[0]));
    }
    if (!user) { alert('کاربر یافت نشد'); return; }
    editName.value = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    editCode.value = user.nationalCode || '';
    editPhone.value = user.phone || '';
    editName.placeholder = 'نام و نام خانوادگی';
    editCode.placeholder = '۴ رقم آخر شماره ملی';
    editPhone.placeholder = 'شماره تماس (اختیاری)';
  }
  editModal.style.display = 'flex';
  editName.focus();
}

function closeModal() {
  editModal.style.display = 'none';
  editIds = [];
  isBatch = false;
}

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  let saved = false;
  if (isBatch) {
    try {
      const body = { ids: editIds };
      const nameVal = editName.value.trim();
      if (nameVal) {
        const parts = nameVal.split(' ');
        body.firstName = parts[0] || '';
        body.lastName = parts.slice(1).join(' ') || '';
      }
      const codeVal = editCode.value.trim();
      if (codeVal) body.nationalCode = codeVal;
      const phoneVal = editPhone.value.trim();
      if (phoneVal) body.phone = phoneVal;
      const resp = await fetch(API_BASE + '/bulk_update.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await resp.json();
      if (result.success) saved = true;
    } catch {}
    if (!saved) {
      let localData = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
      editIds.forEach(id => {
        const idx = localData.findIndex(u => String(u.id) === String(id));
        if (idx === -1) return;
        const nameVal = editName.value.trim();
        if (nameVal) {
          const parts = nameVal.split(' ');
          localData[idx].firstName = parts[0] || '';
          localData[idx].lastName = parts.slice(1).join(' ') || '';
        }
        const codeVal = editCode.value.trim();
        if (codeVal) localData[idx].nationalCode = codeVal;
        const phoneVal = editPhone.value.trim();
        if (phoneVal) localData[idx].phone = phoneVal;
      });
      localStorage.setItem('atrmal_users', JSON.stringify(localData));
    }
  } else {
    try {
      const parts = editName.value.trim().split(' ');
      const resp = await fetch(API_BASE + '/update_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editIds[0],
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
          nationalCode: editCode.value.trim(),
          phone: editPhone.value.trim(),
        }),
      });
      const result = await resp.json();
      if (result.success) saved = true;
    } catch {}
    if (!saved) {
      let localData = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
      const idx = localData.findIndex(u => String(u.id) === String(editIds[0]));
      if (idx === -1) { alert('کاربر یافت نشد'); closeModal(); return; }
      const nameParts = editName.value.trim().split(' ');
      localData[idx].firstName = nameParts[0] || '';
      localData[idx].lastName = nameParts.slice(1).join(' ') || '';
      localData[idx].nationalCode = editCode.value.trim();
      localData[idx].phone = editPhone.value.trim();
      localStorage.setItem('atrmal_users', JSON.stringify(localData));
    }
  }
  closeModal();
  loadData();
});

window.editUser = function(id) {
  openEditModal([id], false);
};

window.deleteUser = function(id) {
  deleteUser(id);
};

window.updateBatchButtons = updateBatchButtons;

modalClose.addEventListener('click', closeModal);
modalCancelBtn.addEventListener('click', closeModal);
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeModal();
});

selectAll.addEventListener('change', function () {
  document.querySelectorAll('.user-check').forEach(cb => cb.checked = this.checked);
  updateBatchButtons();
});

batchEditBtn.addEventListener('click', () => {
  const ids = getSelectedIds();
  if (!ids.length) { alert('کاربری انتخاب نشده'); return; }
  openEditModal(ids, true);
});

batchDeleteBtn.addEventListener('click', async () => {
  const ids = getSelectedIds();
  if (!ids.length) { alert('کاربری انتخاب نشده'); return; }
  if (!confirm(`آیا از حذف ${ids.length} کاربر انتخاب شده اطمینان دارید؟`)) return;
  let saved = false;
  try {
    const resp = await fetch(API_BASE + '/bulk_delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const result = await resp.json();
    if (result.success) saved = true;
  } catch {}
  if (!saved) {
    let localData = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
    localData = localData.filter(u => !ids.includes(String(u.id)));
    localStorage.setItem('atrmal_users', JSON.stringify(localData));
  }
  loadData();
});

exportBtn.addEventListener('click', exportCSV);
refreshBtn.addEventListener('click', loadData);

clearBtn.addEventListener('click', async () => {
  if (!confirm('آیا از پاک کردن تمام اطلاعات (سرور و مرورگر) اطمینان دارید؟')) return;
  try {
    await fetch(API_BASE + '/clear_all.php', { method: 'POST' });
  } catch {}
  localStorage.removeItem('atrmal_users');
  allUsers = [];
  applySearch();
  updateStats({ total: 0, today: 0, withPhone: 0 });
});

logoutBtn.addEventListener('click', logout);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dashboard.style.display === 'block') {
    if (editModal.style.display === 'flex') { closeModal(); return; }
    if (searchTerm) { searchClearBtn.click(); return; }
    logout();
  }
});

if (checkSession()) {
  loadData();
}
})();
