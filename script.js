(function() {
  'use strict';

  const GAS_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
  
  const SERVICE_PRICES = {
    sim: {
      'mpt-3gb': 1500,
      'mpt-5gb': 2500,
      'telenor-regular': 1000,
      'ooredoo-data': 2000
    },
    game: {
      'freefire-100': 3000,
      'pubg-60': 2000,
      'mlbb-86': 2500
    },
    smm: {
      'fb-likes': 2000,
      'fb-followers': 4000,
      'fb-views': 1500,
      'ig-followers': 4000,
      'ig-likes': 2000,
      'ig-comments': 3000,
      'yt-subscribers': 8000,
      'yt-views': 2500,
      'yt-likes': 1500
    }
  };

  const VALIDATION_RULES = {
    phone: /^09[0-9]{9}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    notEmpty: /.+/,
    txid: /^[a-zA-Z0-9-_\.]{5,}$/
  };

  let autoRefreshInterval;
  let adminRefreshInterval;
  let statsRefreshInterval;

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initUser();
    initPageSpecific();
  });

  function initPageSpecific() {
    if (document.getElementById('dashboard-page')) initDashboard();
    if (document.getElementById('order-sim-form')) initSimForm();
    if (document.getElementById('order-game-form')) initGameForm();
    if (document.getElementById('order-smm-form')) initSmmForm();
    if (document.getElementById('p2p-exchange-form')) initP2PForm();
    if (document.getElementById('status-page')) initStatusPage();
    if (document.getElementById('faq-page')) initFaq();
    if (document.getElementById('admin-page')) initAdminPage();
  }

  function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    applyTheme(currentTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.innerHTML = theme === 'dark' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-6.364-.386l1.591-1.591M3 12H.75m.386-6.364l1.591 1.591" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>`;
    }
  }

  function initUser() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem('userId', userId);
    }
    
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg) {
      welcomeMsg.textContent = `Welcome, ${userId.substring(0, 8)}...`;
    }
    
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
      userAvatar.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        container.removeChild(toast);
      }, 300);
    }, 3000);
  }

  function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...`;
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || 'Submit';
    }
  }

  async function fetchAPI(payload) {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(GAS_URL, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
          return result.data;
        } else {
          throw new Error(result.message || 'API error');
        }

      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('API Error:', error);
          showToast(`Error: ${error.message}`, 'error');
        }
        await new Promise(res => setTimeout(res, 1000 * (3 - retries)));
      }
    }
    return null;
  }

  async function fetchAPIGet(params) {
    const url = new URL(GAS_URL);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          redirect: 'follow',
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
          return result.data;
        } else {
          throw new Error(result.message || 'API error');
        }
      } catch (error) {
        retries--;
        if (retries === 0) {
          console.error('API Error:', error);
          showToast(`Error: ${error.message}`, 'error');
        }
        await new Promise(res => setTimeout(res, 1000 * (3 - retries)));
      }
    }
    return null;
  }

  function validateField(input, rule) {
    const validationMessage = input.nextElementSibling;
    if (rule.test(input.value)) {
      input.classList.remove('is-invalid');
      if (validationMessage && validationMessage.classList.contains('error-message')) {
        validationMessage.textContent = '';
      }
      return true;
    } else {
      input.classList.add('is-invalid');
      if (validationMessage && validationMessage.classList.contains('error-message')) {
        validationMessage.textContent = input.dataset.errorMessage || 'Invalid input';
      }
      return false;
    }
  }

  function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach(input => {
      const rule = VALIDATION_RULES[input.dataset.validate];
      if (rule && !validateField(input, rule)) {
        isValid = false;
      }
    });
    return isValid;
  }

  function calculateTotal(category, service, quantity = 1) {
    if (SERVICE_PRICES[category] && SERVICE_PRICES[category][service]) {
      return SERVICE_PRICES[category][service] * parseInt(quantity, 10);
    }
    return 0;
  }

  function initSimForm() {
    const form = document.getElementById('order-sim-form');
    const serviceSelect = form.querySelector('#sim-service');
    const totalDisplay = form.querySelector('#total-amount');

    function updateSimPrice() {
      const selectedService = serviceSelect.value;
      const total = calculateTotal('sim', selectedService, 1);
      totalDisplay.textContent = `${total.toLocaleString()} MMK`;
    }

    serviceSelect.addEventListener('change', updateSimPrice);
    updateSimPrice();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fix errors in the form.', 'error');
        return;
      }
      
      const button = form.querySelector('button[type="submit"]');
      button.dataset.originalText = button.innerHTML;
      setButtonLoading(button, true);

      const formData = new FormData(form);
      const data = {
        action: 'submitSim',
        userId: localStorage.getItem('userId'),
        phone: formData.get('phone'),
        service: formData.get('service'),
        total: calculateTotal('sim', formData.get('service'), 1),
        payment: formData.get('payment'),
        txid: formData.get('txid')
      };

      const result = await fetchAPI(data);
      setButtonLoading(button, false);

      if (result) {
        showToast(`Order ${result.orderId} submitted successfully!`, 'success');
        form.reset();
        updateSimPrice();
        window.location.href = 'status.html';
      }
    });
  }

  function initGameForm() {
    const form = document.getElementById('order-game-form');
    const serviceSelect = form.querySelector('#game-package');
    const quantityInput = form.querySelector('#game-quantity');
    const totalDisplay = form.querySelector('#total-amount');

    function updateGamePrice() {
      const selectedService = serviceSelect.value;
      const quantity = quantityInput.value || 1;
      const total = calculateTotal('game', selectedService, quantity);
      totalDisplay.textContent = `${total.toLocaleString()} MMK`;
    }

    serviceSelect.addEventListener('change', updateGamePrice);
    quantityInput.addEventListener('input', updateGamePrice);
    updateGamePrice();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fix errors in the form.', 'error');
        return;
      }
      
      const button = form.querySelector('button[type="submit"]');
      button.dataset.originalText = button.innerHTML;
      setButtonLoading(button, true);

      const formData = new FormData(form);
      const data = {
        action: 'submitGame',
        userId: localStorage.getItem('userId'),
        gameId: formData.get('game-id'),
        service: formData.get('service'),
        quantity: formData.get('quantity'),
        total: calculateTotal('game', formData.get('service'), formData.get('quantity')),
        payment: formData.get('payment'),
        txid: formData.get('txid')
      };

      const result = await fetchAPI(data);
      setButtonLoading(button, false);

      if (result) {
        showToast(`Order ${result.orderId} submitted successfully!`, 'success');
        form.reset();
        updateGamePrice();
        window.location.href = 'status.html';
      }
    });
  }

  function initSmmForm() {
    const form = document.getElementById('order-smm-form');
    const platformSelect = form.querySelector('#smm-platform');
    const serviceSelect = form.querySelector('#smm-service');
    const quantityInput = form.querySelector('#smm-quantity');
    const priceDisplay = form.querySelector('#price-per-unit');
    const totalDisplay = form.querySelector('#total-amount');

    const platformServices = {
      fb: [
        { value: 'fb-likes', text: 'Facebook Likes' },
        { value: 'fb-followers', text: 'Facebook Followers' },
        { value: 'fb-views', text: 'Facebook Views' }
      ],
      ig: [
        { value: 'ig-followers', text: 'Instagram Followers' },
        { value: 'ig-likes', text: 'Instagram Likes' },
        { value: 'ig-comments', text: 'Instagram Comments' }
      ],
      yt: [
        { value: 'yt-subscribers', text: 'YouTube Subscribers' },
        { value: 'yt-views', text: 'YouTube Views' },
        { value: 'yt-likes', text: 'YouTube Likes' }
      ]
    };

    function updateSmmServices() {
      const platform = platformSelect.value;
      serviceSelect.innerHTML = '';
      platformServices[platform].forEach(service => {
        const option = document.createElement('option');
        option.value = service.value;
        option.textContent = service.text;
        serviceSelect.appendChild(option);
      });
      updateSmmPrice();
    }

    function updateSmmPrice() {
      const service = serviceSelect.value;
      const quantity = quantityInput.value || 1;
      const pricePerUnit = SERVICE_PRICES.smm[service] || 0;
      const total = pricePerUnit * quantity;

      priceDisplay.textContent = `${pricePerUnit.toLocaleString()} MMK / 100 units`;
      totalDisplay.textContent = `${total.toLocaleString()} MMK`;
    }

    platformSelect.addEventListener('change', updateSmmServices);
    serviceSelect.addEventListener('change', updateSmmPrice);
    quantityInput.addEventListener('input', updateSmmPrice);
    updateSmmServices();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fix errors in the form.', 'error');
        return;
      }
      
      const button = form.querySelector('button[type="submit"]');
      button.dataset.originalText = button.innerHTML;
      setButtonLoading(button, true);

      const formData = new FormData(form);
      const service = formData.get('service');
      const quantity = formData.get('quantity');
      const data = {
        action: 'submitSmm',
        userId: localStorage.getItem('userId'),
        platform: formData.get('platform'),
        service: service,
        link: formData.get('link'),
        quantity: quantity,
        total: SERVICE_PRICES.smm[service] * quantity,
        payment: formData.get('payment'),
        txid: formData.get('txid')
      };

      const result = await fetchAPI(data);
      setButtonLoading(button, false);

      if (result) {
        showToast(`Order ${result.orderId} submitted successfully!`, 'success');
        form.reset();
        updateSmmServices();
        window.location.href = 'status.html';
      }
    });
  }

  function initP2PForm() {
    const form = document.getElementById('p2p-exchange-form');
    const amountSentInput = form.querySelector('#p2p-amount');
    const feeDisplay = form.querySelector('#p2p-fee');
    const receiveDisplay = form.querySelector('#p2p-receive');

    function updateP2PPrice() {
      const amount = parseFloat(amountSentInput.value) || 0;
      const fee = amount * 0.02;
      const receive = amount - fee;

      feeDisplay.textContent = `${fee.toLocaleString()} MMK (2%)`;
      receiveDisplay.textContent = `${receive.toLocaleString()} MMK`;
    }

    amountSentInput.addEventListener('input', updateP2PPrice);
    updateP2PPrice();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(form)) {
        showToast('Please fix errors in the form.', 'error');
        return;
      }
      
      const button = form.querySelector('button[type="submit"]');
      button.dataset.originalText = button.innerHTML;
      setButtonLoading(button, true);
      
      const formData = new FormData(form);
      const amount = parseFloat(formData.get('amount'));
      const fee = amount * 0.02;
      
      const data = {
        action: 'submitP2P',
        userId: localStorage.getItem('userId'),
        from: formData.get('from'),
        to: formData.get('to'),
        amountSent: amount,
        fee: fee,
        amountReceive: amount - fee,
        accountDetails: formData.get('account-details'),
        txid: formData.get('txid')
      };

      const result = await fetchAPI(data);
      setButtonLoading(button, false);

      if (result) {
        showToast(`Exchange ${result.orderId} submitted!`, 'success');
        form.reset();
        updateP2PPrice();
        window.location.href = 'status.html';
      }
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        
        const tempInput = document.createElement('input');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        tempInput.value = text;
        document.body.appendChild(tempInput);
        
        try {
          tempInput.select();
          document.execCommand('copy');
          showToast('Copied to clipboard!', 'success');
        } catch (err) {
          showToast('Failed to copy.', 'error');
        }
        
        document.body.removeChild(tempInput);
      });
    });
  }

  function initDashboard() {
    async function fetchStats() {
      const data = await fetchAPIGet({
        action: 'stats',
        userId: localStorage.getItem('userId')
      });
      
      if (data) {
        document.getElementById('stats-total-orders').textContent = data.totalOrders;
        document.getElementById('stats-total-spent').textContent = `${data.totalSpent.toLocaleString()} MMK`;
        document.getElementById('stats-pending-orders').textContent = data.pendingOrders;
      }
    }
    
    async function fetchRecentOrders() {
      const data = await fetchAPIGet({
        action: 'list',
        userId: localStorage.getItem('userId'),
        limit: 5
      });
      
      const tableBody = document.getElementById('recent-orders-table');
      if (data && tableBody) {
        if (data.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">No recent orders.</td></tr>`;
          return;
        }
        
        tableBody.innerHTML = data
          .map(order => `
            <tr>
              <td class="py-3 px-4">${order.orderId.substring(0, 8)}...</td>
              <td class="py-3 px-4">${order.service}</td>
              <td class="py-3 px-4">${order.total.toLocaleString()} MMK</td>
              <td class="py-3 px-4">${renderStatusBadge(order.status)}</td>
            </tr>
          `)
          .join('');
      }
    }

    fetchStats();
    fetchRecentOrders();
    
    clearInterval(statsRefreshInterval);
    statsRefreshInterval = setInterval(() => {
      fetchStats();
      fetchRecentOrders();
    }, 30000);
  }
  
  function initStatusPage() {
    const tabs = document.querySelectorAll('#status-tabs button');
    const tableBody = document.getElementById('status-table-body');
    const emptyState = document.getElementById('empty-state');
    const lastUpdate = document.getElementById('last-update');
    const refreshBtn = document.getElementById('refresh-btn');
    let currentFilter = 'all';

    async function fetchOrders(filter = 'all') {
      const data = await fetchAPIGet({
        action: 'list',
        userId: localStorage.getItem('userId'),
        filter: filter
      });
      
      lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
      
      if (!data || data.length === 0) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
      }
      
      emptyState.classList.add('hidden');
      tableBody.innerHTML = data
        .map(order => `
          <tr>
            <td class="py-3 px-4">${order.orderId}</td>
            <td class="py-3 px-4">${order.service}</td>
            <td class="py-3 px-4">${order.quantity || 1}</td>
            <td class="py-3 px-4">${order.total.toLocaleString()} MMK</td>
            <td class="py-3 px-4">${order.payment}</td>
          <td class="py-3 px-4">${renderStatusBadge(order.status)}</td>
          </tr>
        `)
        .join('');
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('border-primary', 'text-primary'));
        tab.classList.add('border-primary', 'text-primary');
        currentFilter = tab.dataset.filter;
        fetchOrders(currentFilter);
      });
    });

    refreshBtn.addEventListener('click', () => fetchOrders(currentFilter));

    fetchOrders(currentFilter);
    
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => fetchOrders(currentFilter), 15000);
  }

  function renderStatusBadge(status) {
    status = status ? status.toLowerCase() : 'pending';
    switch (status) {
      case 'pending':
        return `<span class="badge badge-pending">Pending</span>`;
      case 'processing':
        return `<span class="badge badge-processing">Processing</span>`;
      case 'success':
        return `<span class="badge badge-success">Success</span>`;
      case 'cancelled':
        return `<span class="badge badge-cancelled">Cancelled</span>`;
      default:
        return `<span class="badge badge-pending">${status}</span>`;
    }
  }

  function initFaq() {
    const items = document.querySelectorAll('.accordion-item');
    
    items.forEach(item => {
      const header = item.querySelector('.accordion-header');
      header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        items.forEach(i => i.classList.remove('active'));
        
        if (!isActive) {
          item.classList.add('active');
        }
      });
    });
  }

  function initAdminPage() {
    const tableBody = document.getElementById('admin-table-body');
    const lastUpdate = document.getElementById('admin-last-update');
    const refreshBtn = document.getElementById('admin-refresh-btn');
    const searchInput = document.getElementById('admin-search');
    
    let allOrders = [];

    async function fetchAdminData() {
      const data = await fetchAPIGet({ action: 'adminData' });
      lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
      
      if (data && data.orders) {
        allOrders = data.orders.map(order => ({
          ...order,
          timestamp: new Date(order.timestamp)
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        renderAdminTable();
      }
    }

    function renderAdminTable() {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const searchTerm = searchInput.value.toLowerCase();
      
      const filteredOrders = allOrders.filter(order => {
        return !searchTerm ||
               (order.orderId && order.orderId.toLowerCase().includes(searchTerm)) ||
               (order.userId && order.userId.toLowerCase().includes(searchTerm)) ||
               (order.target && order.target.toLowerCase().includes(searchTerm));
      });
      
      const grouped = {
        pending: filteredOrders.filter(o => o.status === 'Pending'),
        processing: filteredOrders.filter(o => o.status === 'Processing'),
        success: filteredOrders.filter(o => o.status === 'Success'),
        cancelled: filteredOrders.filter(o => o.status === 'Cancelled')
      };
      
      tableBody.innerHTML = '';
      
      for (const status in grouped) {
        const group = grouped[status];
        if (group.length === 0 && !searchTerm) continue;
        
        const groupHtml = `
          <tbody class="admin-group" data-status="${status}">
            <tr class="sticky top-0">
              <td colspan="9" class="p-0">
                <h2 class="text-lg font-bold capitalize p-3 bg-gray-100 dark:bg-gray-800">${status} (${group.length})</h2>
              </td>
            </tr>
            ${group.map(order => {
              const isNew = order.timestamp > fiveMinutesAgo;
              return `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="p-3">${order.orderId} ${isNew ? '<span class="new-badge">NEW</span>' : ''}</td>
                  <td class="p-3">${order.userId.substring(0, 8)}...</td>
                  <td class="p-3">${order.service}</td>
                  <td class="p-3">${order.target || 'N/A'}</td>
                  <td class="p-3">${order.quantity || 1}</td>
                  <td class="p-3">${order.total.toLocaleString()} MMK</td>
                  <td class="p-3">${order.txid || 'N/A'}</td>
                  <td class="p-3">${order.timestamp.toLocaleString()}</td>
                  <td class="p-3">
                    <select class="form-select status-select" data-order-id="${order.orderId}" data-sheet="${order.sheetName}">
                      <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                      <option value="Success" ${order.status === 'Success' ? 'selected' : ''}>Success</option>
                      <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        `;
        tableBody.innerHTML += groupHtml;
      }
      
      if (filteredOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-8">No orders found.</td></tr>`;
      }
    }

    async function updateOrderStatus(orderId, sheetName, newStatus) {
      const result = await fetchAPI({
        action: 'updateStatus',
        orderId: orderId,
        sheetName: sheetName,
        status: newStatus
      });

      if (result) {
        showToast(`Order ${orderId} updated to ${newStatus}`, 'success');
        const order = allOrders.find(o => o.orderId === orderId);
        if (order) order.status = newStatus;
        renderAdminTable();
      }
    }
    
    tableBody.addEventListener('change', (e) => {
      if (e.target.classList.contains('status-select')) {
        const { orderId, sheet } = e.target.dataset;
        const newStatus = e.target.value;
        updateOrderStatus(orderId, sheet, newStatus);
      }
    });

    refreshBtn.addEventListener('click', fetchAdminData);
    searchInput.addEventListener('input', () => {
      clearTimeout(searchInput.timer);
      searchInput.timer = setTimeout(renderAdminTable, 300);
    });

    fetchAdminData();
    
    clearInterval(adminRefreshInterval);
    adminRefreshInterval = setInterval(fetchAdminData, 10000);
  }

})();
