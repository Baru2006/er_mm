/* script.js - Frontend logic: UserID/Role localStorage, fetch() integration, price calculation, copy button, validation */

/* CONFIG - Replace with your Google Apps Script Web App URL */
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxEgEr3G_C_yqIWNAmNjmAARAseY_yLZAxSc0snePJnL_XKvmAiw7nhRRZtQsTmqQtRiw/exec'; // e.g. https://script.google.com/macros/s/AAA.../exec

/* Utility functions */
function uuidv4() {
  // simple UUID generator
  return 'xxxxxxxxyxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function nowISO() {
  return new Date().toISOString();
}

function formatMoney(v) {
  if (typeof v !== 'number') v = Number(v) || 0;
  return v.toLocaleString(undefined, {maximumFractionDigits:0});
}

/* ---- User handling ---- */
function initUser() {
  if (!localStorage.getItem('ERMM_UserID')) {
    localStorage.setItem('ERMM_UserID', uuidv4());
    localStorage.setItem('ERMM_Role', 'Customer');
    localStorage.setItem('ERMM_CreatedAt', nowISO());
    // Persist to backend Users sheet optionally (best effort).
    // Not mandatory for local UI flow.
  }
}

function getUserId() {
  return localStorage.getItem('ERMM_UserID') || '';
}
function getUserRole() {
  return localStorage.getItem('ERMM_Role') || 'Customer';
}
function setUserRole(role) {
  localStorage.setItem('ERMM_Role', role);
}
function showUserInfo(userIdSelector = '#userId', userRoleSelector = '#userRole') {
  try {
    const uid = getUserId();
    const role = getUserRole();
    const elId = document.querySelector(userIdSelector);
    const elRole = document.querySelector(userRoleSelector);
    if (elId) elId.textContent = `User: ${uid.slice(0,8)}`;
    if (elRole) elRole.textContent = `Role: ${role}`;
  } catch(e){ console.warn(e) }
}

/* ---- Price calculation ---- */
function calculateRolePrice(serviceType, baseValue, role = getUserRole()) {
  // baseValue can be a raw price or multiplier
  // Use PRICES defined in price.js
  if (!window.PRICES) return Number(baseValue) || 0;
  const roleObj = window.PRICES[role] || window.PRICES['Customer'];
  let price = Number(baseValue) || 0;

  if (serviceType === 'sim' || serviceType === 'game' || serviceType === 'smm') {
    const discount = (roleObj[serviceType] && roleObj[serviceType].discount) || 0;
    price = Math.round(price * (1 - discount));
    return price;
  }
  // generic fallback
  const mult = roleObj.genericMultiplier || 1.0;
  return Math.round(price * mult);
}

/* ---- Copy button helpers ---- */
function addGlobalCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    if (btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const target = document.getElementById(targetId);
      if (!target) return;
      target.select ? target.select() : null;
      try {
        navigator.clipboard.writeText(target.value || target.textContent || '')
          .then(() => {
            btn.textContent = 'Copied';
            setTimeout(()=>btn.textContent='Copy',1200);
          })
          .catch(() => {
            // fallback
            const range = document.createRange();
            range.selectNodeContents(target);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            document.execCommand('copy');
            btn.textContent = 'Copied';
            setTimeout(()=>btn.textContent='Copy',1200);
          });
      } catch (e) {
        console.warn('Copy failed', e);
      }
    });
  });
}

/* ---- Form helpers ---- */
function showFormMessage(id, msg, isError = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#ef4444' : '#16a34a';
  setTimeout(()=>{ if(el) el.textContent=''; }, 7000);
}

/* ---- Networking: sendOrder & fetch ---- */
async function sendOrder(payload, msgElementId) {
  try {
    // attach metadata
    payload.Timestamp = nowISO();
    payload.UserID = payload.userId || getUserId();
    payload.Role = payload.role || getUserRole();
    payload.OrderID = `ORD-${Date.now().toString().slice(-8)}`;

    const res = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      showFormMessage(msgElementId, `Server error: ${res.status} ${text}`);
      return false;
    }
    const data = await res.json();
    if (data && data.success) {
      showFormMessage(msgElementId, 'Order submitted successfully!', false);
      return true;
    } else {
      showFormMessage(msgElementId, data.message || 'Unknown server response.');
      return false;
    }
  } catch (err) {
    console.error(err);
    showFormMessage(msgElementId, 'Network error: ' + err.message);
    return false;
  }
}

/* ---- Dashboard stats (simple) ---- */
async function fetchStatsAndRender() {
  try {
    const url = `${GAS_URL}?action=getStats`;
    const res = await fetch(url, { method: 'GET', mode: 'cors', headers: { 'Content-Type': 'application/json' }});
    if (!res.ok) return;
    const data = await res.json();
    document.getElementById('totalOrders').textContent = data.totalOrders || '—';
    document.getElementById('pendingOrders').textContent = data.pending || '—';
    document.getElementById('completedOrders').textContent = data.completed || '—';
    document.getElementById('grossRevenue').textContent = formatMoney(data.gross || 0);
  } catch (e) {
    console.warn('Stats fetch failed', e);
  }
}

/* ---- Expose some functions to window for other pages to use ---- */
window.initUser = initUser;
window.getUserId = getUserId;
window.getUserRole = getUserRole;
window.setUserRole = setUserRole;
window.showUserInfo = showUserInfo;
window.calculateRolePrice = calculateRolePrice;
window.formatMoney = formatMoney;
window.addGlobalCopyButtons = addGlobalCopyButtons;
window.sendOrder = sendOrder;
window.GAS_URL = GAS_URL;
