(function () {
const TARGET = new Date(2026, 6, 27).setHours(0, 0, 0, 0);

const siteLogo = document.getElementById('siteLogo');
if (siteLogo) {
  if (siteLogo.complete && siteLogo.naturalWidth > 0) siteLogo.classList.add('loaded');
  siteLogo.addEventListener('load', () => siteLogo.classList.add('loaded'));
}

const $ = (id) => document.getElementById(id);

const BASE_PATH = (window.location.pathname.match(/\/(?:projects\/)?atrmal\//) || [''])[0].replace(/\/$/, '') || '';
const API_BASE = window.location.origin + BASE_PATH + '/api';

const countdownEls = {
  days: $('days'), hours: $('hours'),
  minutes: $('minutes'), seconds: $('seconds'),
};

const form = $('registerForm');
const fullName = $('fullName');
const nationalCode = $('nationalCode');
const phone = $('phone');
const submitBtn = $('submitBtn');
const btnText = submitBtn?.querySelector('.btn-text');
const btnLoader = submitBtn?.querySelector('.btn-loader');
const heroSection = $('hero');
const successSection = $('successSection');
const successFlash = $('successFlash');
const bannerGallery = $('bannerGallery');
const overlayName = $('overlayName');
const overlayCode = $('overlayCode');
const downloadBtn = $('downloadBtn');
const toast = $('toast');
const toastMsg = $('toastMsg');

function updateCountdown() {
  const now = Date.now();
  let diff = TARGET - now;
  if (diff <= 0) {
    const d = countdownEls.days; if (d) d.textContent = '00';
    const h = countdownEls.hours; if (h) h.textContent = '00';
    const m = countdownEls.minutes; if (m) m.textContent = '00';
    const s = countdownEls.seconds; if (s) s.textContent = '00';
    return;
  }
  const days = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  if (countdownEls.days) countdownEls.days.textContent = String(days).padStart(2, '0');
  if (countdownEls.hours) countdownEls.hours.textContent = String(hours).padStart(2, '0');
  if (countdownEls.minutes) countdownEls.minutes.textContent = String(minutes).padStart(2, '0');
  if (countdownEls.seconds) countdownEls.seconds.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

function validateForm() {
  let valid = true;
  if (!fullName) return false;
  const nameGroup = fullName.closest('.form-group');
  if (!fullName.value.trim()) { nameGroup?.classList.add('error'); valid = false; }
  else { nameGroup?.classList.remove('error'); }
  if (!nationalCode) return false;
  const ncGroup = nationalCode.closest('.form-group');
  const nc = nationalCode.value.trim();
  if (!nc || !/^\d{4}$/.test(nc)) { ncGroup?.classList.add('error'); valid = false; }
  else { ncGroup?.classList.remove('error'); }
  return valid;
}

function setLoading(loading) {
  if (!submitBtn || !btnText || !btnLoader) return;
  btnText.style.display = loading ? 'none' : 'inline';
  btnLoader.style.display = loading ? 'inline-block' : 'none';
  submitBtn.disabled = loading;
}

function normalizeName(str) {
  return str.replace(/\s+/g, '');
}

function findExisting(firstName, lastName) {
  try {
    const existing = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
    const inputName = normalizeName(firstName + lastName);
    return existing.find(u => normalizeName(u.firstName + u.lastName) === inputName);
  } catch { return null; }
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!fullName || !nationalCode) return;

    const nameParts = fullName.value.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const code = nationalCode.value.trim();

    if (findExisting(firstName, lastName)) {
      showToast('\u0642\u0628\u0644\u0627 \u062B\u0628\u062A \u0646\u0627\u0645 \u06A9\u0631\u062F\u06CC\u062F');
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch(API_BASE + '/submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, nationalCode: code,
          phone: phone?.value.trim() || '',
        }),
      });
      const result = await resp.json();
      if (!result.success) {
        showToast(result.error || '\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A');
        setLoading(false);
        return;
      }
      setLoading(false);
      showSuccess(result.user);
    } catch {
      const fallback = saveLocal(firstName, lastName);
      if (fallback) {
        setLoading(false);
        showSuccess(fallback);
      } else {
        showToast('\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631');
        setLoading(false);
      }
    }
  });
}

function saveLocal(fName, lName) {
  try {
    if (findExisting(fName, lName)) return null;
    const data = {
      id: Date.now(), firstName: fName, lastName: lName,
      nationalCode: nationalCode?.value.trim() || '',
      phone: phone?.value.trim() || '',
      date: new Date().toLocaleDateString('fa-IR'),
      timestamp: Date.now(),
    };
    const stored = JSON.parse(localStorage.getItem('atrmal_users') || '[]');
    stored.push(data);
    localStorage.setItem('atrmal_users', JSON.stringify(stored));
    return data;
  } catch { return null; }
}

if (fullName) {
  fullName.addEventListener('input', () => fullName.closest('.form-group')?.classList.remove('error'));
}
if (nationalCode) {
  nationalCode.addEventListener('input', function () {
    const persianMap = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
    const arabicMap = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
    this.value = this.value.replace(/[۰-۹]/g, d => persianMap[d])
                           .replace(/[٠-٩]/g, d => arabicMap[d])
                           .replace(/\D/g, '').slice(0, 4);
    this.closest('.form-group')?.classList.remove('error');
  });
}

function showSuccess(data) {
  if (!heroSection || !successSection) return;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  heroSection.style.display = 'none';
  successSection.style.display = 'flex';
  void successSection.offsetHeight;

  if (overlayName) overlayName.textContent = `${data.firstName} ${data.lastName}`;
  if (overlayCode) overlayCode.textContent = data.nationalCode;
  if (successFlash) {
    successFlash.classList.add('show');
    setTimeout(() => {
      successFlash.classList.remove('show');
      successFlash.classList.add('hide');
      if (bannerGallery) {
        bannerGallery.style.display = 'block';
        bannerGallery.offsetHeight;
        setTimeout(() => bannerGallery.classList.add('show'), 50);
      }
    }, 1800);
  }
}

function loadHtml2Canvas(callback) {
  if (typeof html2canvas !== 'undefined') { callback(); return; }
  showToast('\u062F\u0631 \u062D\u0627\u0644 \u0628\u0627\u0631\u06AF\u06CC\u0631\u06CC \u0627\u0628\u0632\u0627\u0631...');
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  s.onload = () => { showToast('\u0627\u0628\u0632\u0627\u0631 \u0622\u0645\u0627\u062F\u0647 \u0634\u062F'); callback(); };
  s.onerror = () => showToast('\u062E\u0637\u0627 \u062F\u0631 \u0628\u0627\u0631\u06AF\u06CC\u0631\u06CC \u0627\u0628\u0632\u0627\u0631\u060C \u0627\u062A\u0635\u0627\u0644 \u0627\u06CC\u0646\u062A\u0631\u0646\u062A \u0631\u0627 \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F');
  document.head.appendChild(s);
}

function downloadGallery() {
  loadHtml2Canvas(() => {
    showToast('\u062F\u0631 \u062D\u0627\u0644 \u062A\u0647\u06CC\u0647 \u062A\u0635\u0648\u06CC\u0631...');
    const inner = $('bannerGalleryInner');
    if (!inner) return;
    html2canvas(inner, {
      scale: 6, useCORS: true, backgroundColor: '#ffffff',
      logging: false, width: inner.scrollWidth, height: inner.scrollHeight,
      allowTaint: true, imageTimeout: 60000,
    }).then((canvas) => {
      showToast('\u062A\u0635\u0648\u06CC\u0631 \u0622\u0645\u0627\u062F\u0647 \u0634\u062F');
      const link = document.createElement('a');
      link.download = `atrmal-banner-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }).catch(() => showToast('\u062E\u0637\u0627 \u062F\u0631 \u062A\u0647\u06CC\u0647 \u062A\u0635\u0648\u06CC\u0631'));
  });
}

if (downloadBtn) downloadBtn.addEventListener('click', downloadGallery);

let toastTimeout;
function showToast(msg) {
  if (!toastMsg || !toast) return;
  toastMsg.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
})();
