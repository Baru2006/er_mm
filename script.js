// Core client-side functionality for Easy Recharge MM
// Replace YOUR_SCRIPT_URL with deployed Google Apps Script web app URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbx8pdT4fIvxJbAEF2L6bQUu5UYIMHlt2ycpyEufu0XikeJI-3htT7HLmTR7mHlTobk_Sg/exec"; // e.g. "https://script.google.com/macros/s/XXX/exec"
const ADMIN_PHONE = "09-791134604";

document.addEventListener('DOMContentLoaded', () => {
  // show admin phone where present
  const adminElements = document.querySelectorAll('[id^="adminPhone"]');
  adminElements.forEach(el => el.textContent = ADMIN_PHONE);

  // initialize package selects on pages
  if(document.getElementById('provider')) populateSimPackages();
  if(document.getElementById('gameSelect')) populateGamePackages();
  if(document.getElementById('platform')) populateSmmServices();
  // Preload initial totals
  updateP2PCalculations();
});

// copy admin phone
function copyAdminPhone(){
  if(!navigator.clipboard) {
    const tmp = document.createElement('input');
    tmp.value = ADMIN_PHONE;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    tmp.remove();
    alert('Copied admin phone');
    return;
  }
  navigator.clipboard.writeText(ADMIN_PHONE).then(()=> {
    alert('Copied admin phone');
  }).catch(()=> alert('Unable to copy'));
}

// ----- SIM handling -----
function populateSimPackages(){
  const provider = document.getElementById('provider').value;
  const select = document.getElementById('simPackage');
  select.innerHTML = '';
  // map provider to keys in SERVICE_PRICES.sim
  const mapping = {
    mpt: ['mpt-3gb','mpt-5gb'],
    telenor: ['telenor-regular'],
    ooredoo: ['ooredoo-basic']
  };
  (mapping[provider] || []).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = `${k} — ${SERVICE_PRICES.sim[k] || 'N/A'}`;
    select.appendChild(opt);
  });
  updateSimDescriptionAndTotal();
}

function updateSimDescriptionAndTotal(){
  const sel = document.getElementById('simPackage');
  const desc = document.getElementById('simDescription');
  const totalEl = document.getElementById('simTotal');
  if(!sel) return;
  const key = sel.value;
  desc.textContent = key ? (`Package: ${key}`) : 'Select a package';
  const price = SERVICE_PRICES.sim[key] || 0;
  totalEl.textContent = price;
}

// ----- Game handling -----
function populateGamePackages(){
  const game = document.getElementById('gameSelect').value;
  const select = document.getElementById('gamePackage');
  select.innerHTML = '';
  const map = {
    freefire: ['freefire-100'],
    pubg: ['pubg-60'],
    mlbb: ['mlbb-86']
  };
  (map[game] || []).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = `${k} — ${SERVICE_PRICES.game[k] || 'N/A'}`;
    select.appendChild(opt);
  });
  updateGameDescriptionAndTotal();
}

function updateGameDescriptionAndTotal(){
  const sel = document.getElementById('gamePackage');
  const desc = document.getElementById('gameDescription');
  const totalEl = document.getElementById('gameTotal');
  if(!sel) return;
  const key = sel.value;
  desc.textContent = key ? (`Package: ${key}`) : 'Select package';
  const price = SERVICE_PRICES.game[key] || 0;
  totalEl.textContent = price;
}

// ----- SMM handling -----
function populateSmmServices(){
  const platform = document.getElementById('platform').value;
  const select = document.getElementById('smmService');
  select.innerHTML = '';
  const map = {
    facebook: ['fb-likes'],
    instagram: ['ig-followers'],
    youtube: ['yt-subscribers']
  };
  (map[platform] || []).forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = `${k} — ${SERVICE_PRICES.smm[k] || 'N/A'}`;
    select.appendChild(opt);
  });
  updateSmmDescriptionAndTotal();
}

function updateSmmDescriptionAndTotal(){
  const sel = document.getElementById('smmService');
  const qtyEl = document.getElementById('smmQty');
  const desc = document.getElementById('smmDescription');
  const totalEl = document.getElementById('smmTotal');
  if(!sel) return;
  const key = sel.value;
  const qty = parseInt(qtyEl.value || '0', 10);
  desc.textContent = key ? (`Service: ${key}`) : 'Select service';
  const base = SERVICE_PRICES.smm[key] || 0;
  // Calculate total. For this skeleton we treat price value as unit price/standard; adjust as needed.
  // We'll compute proportional price: base * (qty / 100) to avoid huge totals; this is arbitrary but functional.
  const total = Math.max(0, Math.round((base * qty) / 100));
  totalEl.textContent = total;
}

// ----- P2P handling -----
function validateP2PMethods(){
  const from = document.getElementById('p2pFrom').value;
  const to = document.getElementById('p2pTo').value;
  if(from === to){
    document.getElementById('p2pMessage').textContent = 'From and To cannot be the same';
    return false;
  } else {
    document.getElementById('p2pMessage').textContent = '';
    return true;
  }
}

function updateP2PCalculations(){
  const amount = parseFloat(document.getElementById('p2pAmount')?.value || '0');
  const fee = Math.round((amount * 0.02) * 100) / 100;
  const receive = Math.round((amount - fee) * 100) / 100;
  const feeEl = document.getElementById('p2pFee');
  const receiveEl = document.getElementById('p2pReceive');
  if(feeEl) feeEl.textContent = fee;
  if(receiveEl) receiveEl.textContent = receive;
}

// ----- Submit handling for all orders -----
async function submitOrder(event, type){
  event.preventDefault();
  const url = GAS_URL;
  // Build payload depending on type
  const payload = {type, timestamp: new Date().toISOString()};

  try {
    if(type === 'sim'){
      const form = document.getElementById('simOrderForm');
      payload.provider = form.provider.value;
      payload.package = form.package.value;
      payload.description = document.getElementById('simDescription').textContent;
      payload.phone = form.phone.value.trim();
      payload.total = document.getElementById('simTotal').textContent;
      payload.paymentMethod = form.paymentMethod.value;
      payload.transactionId = form.transactionId.value.trim();
      // basic validation
      if(!payload.phone || !payload.transactionId) throw new Error('Phone and Transaction ID are required');
    } else if(type === 'game'){
      const form = document.getElementById('gameOrderForm');
      payload.game = form.game.value;
      payload.package = form.package.value;
      payload.description = document.getElementById('gameDescription').textContent;
      payload.gameId = form.gameId.value.trim();
      payload.server = form.server.value.trim();
      payload.total = document.getElementById('gameTotal').textContent;
      payload.paymentMethod = form.paymentMethod.value;
      payload.transactionId = form.transactionId.value.trim();
      if(!payload.gameId || !payload.transactionId) throw new Error('Game ID and Transaction ID are required');
    } else if(type === 'smm'){
      const form = document.getElementById('smmOrderForm');
      payload.platform = form.platform.value;
      payload.service = form.service.value;
      payload.description = document.getElementById('smmDescription').textContent;
      payload.targetUrl = form.targetUrl.value.trim();
      payload.quantity = Number(form.quantity.value);
      if(isNaN(payload.quantity) || payload.quantity < 25) throw new Error('Quantity must be at least 25');
      payload.total = document.getElementById('smmTotal').textContent;
      payload.paymentMethod = form.paymentMethod.value;
      payload.transactionId = form.transactionId.value.trim();
      if(!payload.targetUrl || !payload.transactionId) throw new Error('Target URL and Transaction ID are required');
    } else if(type === 'p2p'){
      const form = document.getElementById('p2pForm');
      payload.amount = Number(form.amount.value);
      payload.from = form.from.value;
      payload.to = form.to.value;
      if(!validateP2PMethods()) throw new Error('From and To cannot be the same');
      const fee = Math.round((payload.amount * 0.02) * 100) / 100;
      payload.fee = fee;
      payload.receive = Math.round((payload.amount - fee) * 100) / 100;
      payload.transactionId = form.transactionId.value.trim();
      if(!payload.transactionId) throw new Error('Transaction ID is required');
    } else {
      throw new Error('Unknown order type');
    }

    // Add admin phone
    payload.adminPhone = ADMIN_PHONE;

    // POST to GAS
    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });

    if(!resp.ok) {
      const txt = await resp.text();
      throw new Error('Server error: ' + txt);
    }
    const json = await resp.json();
    const messageEl = document.getElementById(`${type}Message`) || document.getElementById('p2pMessage') || document.getElementById('statusMessage');
    if(json.success){
      if(messageEl) messageEl.textContent = 'Order submitted successfully. OrderID: ' + (json.orderId || 'N/A');
      // reset forms minimally
      const frm = document.querySelector(`form#${type}OrderForm`) || document.getElementById('p2pForm');
      if(frm) frm.reset();
      updateP2PCalculations();
      updateSimDescriptionAndTotal();
      updateGameDescriptionAndTotal();
      updateSmmDescriptionAndTotal();
    } else {
      throw new Error(json.error || 'Unknown server error');
    }
  } catch(err){
    const messageEl = document.getElementById(`${type}Message`) || document.getElementById('p2pMessage') || document.getElementById('statusMessage');
    if(messageEl) messageEl.textContent = 'Error: ' + err.message;
    else alert('Error: ' + err.message);
  }
}

// ----- Status page load -----
async function loadOrders(){
  const tableBody = document.getElementById('ordersBody');
  const msg = document.getElementById('statusMessage');
  tableBody.innerHTML = '';
  msg.textContent = 'Loading...';
  try {
    const resp = await fetch(GAS_URL + '?action=getOrders');
    if(!resp.ok) throw new Error('Failed to load orders');
    const data = await resp.json();
    if(!Array.isArray(data.orders)) throw new Error('Invalid response');
    data.orders.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.orderId}</td><td>${row.type}</td><td>${row.contact || row.gameId || ''}</td><td>${row.service || ''}</td><td>${row.total || ''}</td><td>${row.paymentMethod || ''}</td><td>${row.transactionId || ''}</td><td>${row.status || ''}</td><td>${row.timestamp || ''}</td>`;
      tableBody.appendChild(tr);
    });
    msg.textContent = '';
  } catch(err){
    msg.textContent = 'Error loading orders: ' + err.message;
  }
                            }
