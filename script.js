/* script.js */
/* Shared frontend functions: theme, nav, toast, copy, submit templates, firebase placeholders */

const GAS_URL = "YOUR_GAS_DEPLOY_URL"; // Replace with your Apps Script Web App URL

// theme toggle
(function(){
  const body = document.body;
  const toggle = document.getElementById('modeToggle');
  const saved = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  body.dataset.theme = saved;
  if (toggle) toggle.addEventListener('click', ()=> {
    body.dataset.theme = body.dataset.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', body.dataset.theme);
  });
})();

// mobile nav
(function(){
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav-links');
  if (hamburger && nav) {
    hamburger.addEventListener('click', ()=> nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=> nav.classList.remove('open')));
  }
})();

// toast
function showToast(msg, type='info') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.add('show'), 10);
  setTimeout(()=> { t.classList.remove('show'); setTimeout(()=> t.remove(), 300); }, 2800);
}

// copy
function copyText(id){
  const el = document.getElementById(id);
  if(!el){ showToast('Nothing to copy'); return; }
  const val = el.value || el.textContent || el.innerText;
  if (!val) { showToast('Empty value'); return; }
  navigator.clipboard.writeText(val).then(()=> showToast('📋 Copied'), ()=> showToast('⚠️ Copy failed'));
}

// device detection and user id
function detectDevice() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'Android';
  if (/iphone|ipad/.test(ua)) return 'iOS';
  return 'Web';
}
(function initUser(){
  if (!localStorage.getItem('user_id')) {
    const uid = 'U' + Date.now().toString(36) + Math.floor(Math.random()*1000);
    localStorage.setItem('user_id', uid);
  }
  window.USER_ID = localStorage.getItem('user_id');
  window.DEVICE = detectDevice();
  // populate any readonly user fields
  document.querySelectorAll('input[readonly][name="user_id"], input[readonly]#userIdField, input[readonly]#smmUser, input[readonly]#p2pUser').forEach(inp => { if(inp) inp.value = window.USER_ID; });
})();

// helpers
function generateOrderId(prefix='ORD') {
  const d = new Date();
  const date = d.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(Math.random()*9000)+1000;
  return `${prefix}-${date}-${rand}`;
}
function formatDate(ts){ return new Date(ts).toLocaleString(); }

// form validation helper
function requireTransactionId(formId) {
  const f = document.getElementById(formId);
  if (!f) return true;
  const txn = f.querySelector('input[name="transactionId"], input[name="txn"], input[name="transaction_id"]');
  if (txn && !txn.value) {
    showToast('Transaction ID required');
    txn.focus();
    return false;
  }
  return true;
}

// submit template
async function submitOrderForm(formId, endpoint=GAS_URL) {
  const form = document.getElementById(formId);
  if (!form) { showToast('Form not found'); return; }
  const data = {};
  new FormData(form).forEach((v,k)=> data[k]=v);
  data.user_id = data.user_id || window.USER_ID;
  data.device = data.device || window.DEVICE;
  data.orderId = data.orderId || generateOrderId();
  // minimal validation: required fields
  const required = form.querySelectorAll('[required]');
  for (let r of required) {
    if (!form.elements[r.name].value) {
      showToast('Please fill required fields');
      form.elements[r.name].focus();
      return;
    }
  }
  // send
  try {
    const payload = { action: formId === 'smmForm' ? 'order_smm' : (formId === 'p2pForm' ? 'p2p' : 'order'), order: data };
    const res = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json && json.success) {
      showToast('✅ Order submitted');
      localStorage.setItem('last_order_id', data.orderId);
      form.reset();
      return json;
    } else {
      showToast('❌ Submit failed');
      console.error('submitOrderForm error', json);
    }
  } catch (err) {
    console.error(err);
    showToast('❌ Network error');
  }
}

// firebase placeholder (optional) - initialize only if config provided
function initFirebaseAndListeners(firebaseConfig, onChildAdded, onChildChanged) {
  if (!firebaseConfig || !window.firebase) { console.warn('Firebase not initialized'); return; }
  try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const ref = db.ref('orders');
    if (onChildAdded) ref.on('child_added', snap => onChildAdded(snap.val(), snap.key));
    if (onChildChanged) ref.on('child_changed', snap => onChildChanged(snap.val(), snap.key));
  } catch (e) { console.error('Firebase init error', e); }
                                                                    }
