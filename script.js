/* script.js */
(function(){
  // Theme toggle
  const toggle = document.getElementById('modeToggle');
  const body = document.body;
  const currentMode = localStorage.getItem('theme') || 'light';
  body.dataset.theme = currentMode;
  if (toggle) {
    toggle.innerHTML = currentMode === 'light' ? '🌙' : '☀️';
    toggle.addEventListener('click', () => {
      const newMode = body.dataset.theme === 'light' ? 'dark' : 'light';
      body.dataset.theme = newMode;
      localStorage.setItem('theme', newMode);
      toggle.innerHTML = newMode === 'light' ? '🌙' : '☀️';
    });
  }

  // Mobile nav
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    }));
  }

  // Toast
  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(()=> t.classList.add('show'), 10);
    setTimeout(()=> { t.classList.remove('show'); setTimeout(()=>t.remove(), 300); }, 2600);
  }
  window.showToast = showToast;

  // Copy helper (adapted for iFrame/cross-browser compatibility)
  window.copyText = function(id) {
    const el = document.getElementById(id);
    if (!el) { showToast('Nothing to copy'); return; }
    
    // Get the value from input/textarea or innerText
    const val = el.value || el.textContent || el.innerText;

    // Create a temporary textarea element for copying
    const tempInput = document.createElement('textarea');
    tempInput.value = val;
    tempInput.style.position = 'absolute';
    tempInput.style.left = '-9999px'; // Hide off-screen
    document.body.appendChild(tempInput);
    
    try {
      tempInput.select();
      // Use document.execCommand('copy') for better iFrame compatibility
      document.execCommand('copy');
      showToast('📋 Copied: ' + val.substring(0, 20) + '...');
    } catch (err) {
      showToast('⚠️ Copy failed'); 
      console.error('Copy failed:', err);
    } finally {
      document.body.removeChild(tempInput);
    }
  }

  // Device detect & local user id
  function detectDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Web';
  }
  if (!localStorage.getItem('user_id')) {
    const uid = 'U' + Date.now().toString(36) + Math.floor(Math.random()*1000);
    localStorage.setItem('user_id', uid);
  }
  window.USER_ID = localStorage.getItem('user_id');
  window.DEVICE = detectDevice();

  // Simple form submit template
  // NOTE: In a production environment, 'endpoint' would be your deployed Code.gs URL.
  window.submitOrderForm = function(formId, endpoint) {
    const form = document.getElementById(formId);
    if (!form) { showToast('Form not found'); return; }
    
    // basic validation
    const req = form.querySelectorAll('[required]');
    for (let r of req) {
      if (!r.value.trim()) { 
        showToast('Please fill required fields'); 
        r.focus(); 
        return; 
      }
    }
    
    showToast('🚀 Sending order...');

    const data = {};
    new FormData(form).forEach((v,k)=> data[k]=v);
    data.user_id = window.USER_ID;
    data.device = window.DEVICE;
    
    fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    })
    .then(r => {
      if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
      return r.json();
    })
    .then(res=>{
      if (res.status === 'success') {
        showToast('✅ Order submitted! ID: ' + (res.orderId || 'N/A'));
        localStorage.setItem('last_order_id', res.orderId || Date.now());
        form.reset();
      } else {
        showToast('❌ Submit failed: ' + res.message);
        console.error('Backend error:', res);
      }
    }).catch(err=>{ 
      showToast('❌ Submit failed: Check console'); 
      console.error('Fetch error:', err); 
    });
  }

  // Simple validator for transaction ID presence
  window.requireTransactionId = function(formId) {
    const f = document.getElementById(formId);
    if (!f) return true;
    const txn = f.querySelector('input[name="transactionId"], input[name="txnId"], input[name="transaction_id"]');
    if (txn && !txn.value.trim()) {
      showToast('Transaction ID required');
      txn.focus();
      return false;
    }
    return true;
  }

})();

    
