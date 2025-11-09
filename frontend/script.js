// script.js - shared frontend functions
// - initUser(): persistent userId + role stored in localStorage
// - sendOrder(payload): POST to API_ROOT/api/order
// - getOrders(userId): GET API_ROOT/api/status?userId=...
// - copyAdminPhone(): copies displayed admin phone
// Replace API_ROOT placeholder to point to deployed API root (e.g. https://your-app.vercel.app)
const API_ROOT = window.https://easyrechargemm.vercel.app || (location.origin); // if using Vercel, same origin; for GitHub Pages set API_ROOT manually

// Initialize user id and role
function initUser() {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = 'u_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('userId', userId);
  }
  let role = localStorage.getItem('role');
  if (!role) {
    // default role; change to 'Reseller' manually if needed
    role = 'Customer';
    localStorage.setItem('role', role);
  }
  // Inject UI
  const uidEl = document.getElementById('user-id');
  const roleEl = document.getElementById('user-role');
  if (uidEl) uidEl.textContent = `User: ${userId}`;
  if (roleEl) roleEl.textContent = `Role: ${role}`;

  // Update admin phone year
  const y = new Date().getFullYear();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = y;
}

// copy admin phone from page element with id admin-phone
function copyAdminPhone() {
  const el = document.getElementById('admin-phone');
  if (!el) return;
  const text = el.textContent.trim();
  navigator.clipboard?.writeText(text).then(() => {
    alert('Admin phone copied: ' + text);
  }).catch(() => {
    // fallback
    const tmp = document.createElement('input');
    document.body.appendChild(tmp);
    tmp.value = text;
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
    alert('Admin phone copied: ' + text);
  });
}

// sendOrder: posts payload to /api/order
async function sendOrder(payload) {
  // Attach userId if missing
  payload.userId = payload.userId || localStorage.getItem('userId') || null;
  // Minimal client-side validation (expand as needed)
  if (!payload.userId) { alert('UserId missing'); return; }
  try {
    const res = await fetch(`${API_ROOT}/api/order`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      alert('Error: ' + (data?.error || res.statusText));
      console.error(data);
      return;
    }
    alert('Order submitted. OrderID: ' + (data.orderId || '—'));
    // Optionally redirect to status page
    location.href = 'status.html';
  } catch (err) {
    console.error(err);
    alert('Network error. See console for details.');
  }
}

// getOrders: returns array of orders for user
async function getOrders(userId) {
  const res = await fetch(`${API_ROOT}/api/status?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

// expose functions globally for page-level scripts
window.initUser = initUser;
window.copyAdminPhone = copyAdminPhone;
window.sendOrder = sendOrder;
window.getOrders = getOrders;
window.API_ROOT = API_ROOT;

// auto-init on page load
initUser();
