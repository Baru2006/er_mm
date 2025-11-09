// script.js - core frontend logic
// Requires: config.js (API_URL) and price.js
if (typeof API_URL === 'undefined') {
  console.warn('API_URL not defined. Copy config.example.js -> config.js and set API_URL');
}

// --------- Utilities ----------
function genUserId() {
  return 'USER-' + Math.random().toString(36).slice(2,10).toUpperCase();
}
function uid() {
  let id = localStorage.getItem('easy_userid');
  if (!id) { id = genUserId(); localStorage.setItem('easy_userid', id); }
  return id;
}
function role() {
  let r = localStorage.getItem('easy_role');
  if (!r) { r = 'Customer'; localStorage.setItem('easy_role', r); }
  return r;
}
function setRole(r) { localStorage.setItem('easy_role', r); }
function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(()=> alert('Copied'));
}

// --------- Display & Init ----------
function initUser() {
  document.querySelectorAll('.user-id').forEach(el => el.textContent = uid());
  document.querySelectorAll('.user-role').forEach(el => el.textContent = role());
  const roleToggle = document.getElementById('roleToggle');
  if (roleToggle) roleToggle.value = role();
  displayUserKPI();
}
function displayUserKPI(){ /* placeholder: fetch counts */
  // showing static placeholders, profile page calls getOrders to compute real stats
}

// --------- Pricing ----------
function calculatePrice(type, key, quantity=1) {
  let base = 0;
  if (type === 'sim' || type === 'game' || type === 'smm') {
    base = SERVICE_PRICES[type][key] || 0;
    if (type === 'smm') base = base * (quantity || 1);
  }
  if (role() === 'Reseller') base = Math.round(base * (1 - RESELLER_DISCOUNT));
  return base;
}
function calculateP2P(amount) {
  const fee = Math.round(amount * SERVICE_PRICES.p2p.feePercent);
  return {fee, receive: Math.max(0, amount - fee)};
}

// --------- API calls ----------
async function sendOrder(payload) {
  if (!API_URL) return {success:false, message:'API_URL not set'};
  payload.userId = uid();
  payload.timestamp = (new Date()).toISOString();
  try {
    const res = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action:'createOrder', order: payload})
    });
    const j = await res.json();
    return j;
  } catch(e) {
    console.error(e);
    return {success:false, message:e.message || 'Network error'};
  }
}

async function fetchOrders({userId, limit=50, full=false} = {}) {
  if (!API_URL) return {success:false, message:'API_URL not set'};
  try {
    const url = new URL(API_URL);
    url.searchParams.set('action', 'getOrders');
    if (userId) url.searchParams.set('userId', userId);
    if (full) url.searchParams.set('full', '1');
    if (limit) url.searchParams.set('limit', String(limit));
    const res = await fetch(url.toString());
    const j = await res.json();
    return j;
  } catch(e) {
    console.error(e);
    return {success:false, message:e.message || 'Network error'};
  }
}

// --------- Form setup helpers ----------
function setupOrderSim(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const providerEl = form.querySelector('[name="provider"]');
  const packageEl = form.querySelector('[name="package"]');
  const phoneEl = form.querySelector('[name="phone"]');
  const totalEl = form.querySelector('.total');
  function recalc(){
    const key = packageEl.value;
    const total = calculatePrice('sim', key, 1);
    totalEl.textContent = total;
  }
  packageEl?.addEventListener('change', recalc);
  recalc();
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const payload = {
      type:'SIM',
      service: packageEl.value,
      provider: providerEl.value,
      target: phoneEl.value,
      quantity:1,
      total: Number(totalEl.textContent),
      paymentMethod: form.payment_method?.value || '',
      transactionId: form.transaction_id?.value || '',
      notes: form.notes?.value || ''
    };
    const res = await sendOrder(payload);
    if (res.success) {
      alert('Order placed: ' + res.orderId);
      form.reset();
      recalc();
    } else alert('Error: ' + (res.message || 'unknown'));
  });
}

function setupOrderGame(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const gameEl = form.querySelector('[name="game"]');
  const packEl = form.querySelector('[name="package"]');
  const totalEl = form.querySelector('.total');
  function recalc(){
    const key = packEl.value;
    const total = calculatePrice('game', key, 1);
    totalEl.textContent = total;
  }
  packEl?.addEventListener('change', recalc);
  recalc();
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const payload = {
      type:'GAME',
      game: gameEl.value,
      package: packEl.value,
      gameId: form.game_id?.value || '',
      server: form.server?.value || '',
      total: Number(totalEl.textContent),
      paymentMethod: form.payment_method?.value || '',
      transactionId: form.transaction_id?.value || ''
    };
    const res = await sendOrder(payload);
    if (res.success) { alert('Order placed: ' + res.orderId); form.reset(); recalc(); }
    else alert('Error: ' + (res.message || 'unknown'));
  });
}

function setupOrderSMM(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const platformEl = form.querySelector('[name="platform"]');
  const serviceEl = form.querySelector('[name="service"]');
  const qtyEl = form.querySelector('[name="quantity"]');
  const totalEl = form.querySelector('.total');

  function recalc(){
    const key = serviceEl.value;
    const qty = Number(qtyEl.value) || 1;
    const base = calculatePrice('smm', key, qty);
    totalEl.textContent = base;
  }
  serviceEl?.addEventListener('change', recalc);
  qtyEl?.addEventListener('input', recalc);
  recalc();
  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const payload = {
      type:'SMM',
      platform: platformEl.value,
      service: serviceEl.value,
      link: form.target_url?.value || '',
      quantity: Number(qtyEl.value) || 1,
      total: Number(totalEl.textContent),
      paymentMethod: form.payment_method?.value || '',
      transactionId: form.transaction_id?.value || ''
    };
    const res = await sendOrder(payload);
    if (res.success) { alert('Order placed: ' + res.orderId); form.reset(); recalc(); }
    else alert('Error: ' + (res.message || 'unknown'));
  });
}

function setupP2P(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  const amtEl = form.querySelector('[name="amount"]');
  const fromEl = form.querySelector('[name="from"]');
  const toEl = form.querySelector('[name="to"]');
  const feeEl = form.querySelector('.fee');
  const receiveEl = form.querySelector('.receive');

  function recalc(){
    const amount = Number(amtEl.value) || 0;
    const {fee, receive} = calculateP2P(amount);
    feeEl.textContent = fee;
    receiveEl.textContent = receive;
  }
  amtEl?.addEventListener('input', recalc);
  recalc();

  form.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    if (fromEl.value === toEl.value) return alert('From and To cannot be same');
    const amount = Number(amtEl.value) || 0;
    const {fee, receive} = calculateP2P(amount);
    const payload = {
      type:'P2P',
      fromMethod: fromEl.value,
      toMethod: toEl.value,
      amountSent: amount,
      fee,
      amountReceive: receive,
      accountDetails: form.account_details?.value || '',
      total: amount
    };
    const res = await sendOrder(payload);
    if (res.success) { alert('Exchange placed: ' + res.orderId); form.reset(); recalc(); }
    else alert('Error: ' + (res.message || 'unknown'));
  });
}

// --------- Profile & Status helpers ----------
async function loadProfile() {
  const userId = uid();
  const res = await fetchOrders({userId, limit: 50});
  if (!res.success) { console.warn(res.message); return; }
  const orders = res.orders || [];
  // compute totals
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((s,o)=>s + Number(o.Total || o.total || 0),0);
  const totalExchange = orders.filter(o => (o.Type||'').toUpperCase() === 'P2P').reduce((s,o)=>s + Number(o.AmountSent || o.amountSent || 0),0);
  // render basics
  document.getElementById('profile_total_orders')?.replaceWith(createTextNodeOrSpan('profile_total_orders', totalOrders));
  document.getElementById('profile_total_spent')?.textContent = totalSpent;
  document.getElementById('profile_total_exchange')?.textContent = totalExchange;
  // last 10 orders
  const table = document.getElementById('last_orders_table');
  if (table) {
    table.innerHTML = '<tr><th>Timestamp</th><th>Type</th><th>Service</th><th>Total</th><th>Status</th></tr>';
    orders.slice(0,10).forEach(o=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${o.Timestamp || o.timestamp || ''}</td>
        <td>${o.Type || o.type || ''}</td>
        <td>${o.Service || o.service || o.Package || ''}</td>
        <td>${o.Total || o.total || ''}</td>
        <td>${o.Status || o.status || 'PENDING'}</td>`;
      table.appendChild(tr);
    });
  }
}

function createTextNodeOrSpan(id, text) {
  const span = document.createElement('span');
  span.id = id;
  span.textContent = text;
  return span;
}

// auto init on pages
document.addEventListener('DOMContentLoaded', ()=> {
  initUser();
  // auto-setup forms if present
  setupOrderSim('form-sim');
  setupOrderGame('form-game');
  setupOrderSMM('form-smm');
  setupP2P('form-p2p');
  // profile page
  if (document.getElementById('profile_page')) loadProfile();
  // status page
  if (document.getElementById('status_page')) {
    (async ()=>{
      const r = await fetchOrders({full:true, limit:200});
      if (!r.success) return;
      const table = document.getElementById('all_orders_table');
      table.innerHTML = '<tr><th>Time</th><th>UserID</th><th>Type</th><th>Service</th><th>Total</th><th>Status</th></tr>';
      (r.orders||[]).forEach(o=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${o.Timestamp||o.timestamp||''}</td><td>${o.UserID||o.userId||''}</td><td>${o.Type||o.type||''}</td><td>${o.Service||o.service||''}</td><td>${o.Total||o.total||''}</td><td>${o.Status||o.status||''}</td>`;
        table.appendChild(tr);
      });
    })();
  }
});
