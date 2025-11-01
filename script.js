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

const THEME_KEY = 'THEME';
const MIN_P2P_AMOUNT = 1000;

const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fixed bottom-4 right-4 p-4 rounded-xl shadow-lg transition-opacity duration-300 z-50`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
};

const setLoadingState = (buttonId, isLoading) => {
    const button = document.getElementById(buttonId);
    if (!button) return;
    const spinner = button.querySelector('.loading-spinner');
    if (isLoading) {
        button.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
        button.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        button.disabled = false;
        if (spinner) spinner.classList.add('hidden');
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
};

const fetchGas = async (action, data = {}, method = 'GET') => {
    const url = new URL(GAS_URL);
    if (method === 'GET') {
        url.searchParams.append('action', action);
        Object.entries(data).forEach(([key, value]) => url.searchParams.append(key, value));
    }
    const options = {
        method: method,
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
    };
    if (method === 'POST') {
        options.body = JSON.stringify({ action, ...data });
    }
    try {
        const response = await fetch(url.toString(), options);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    } catch (error) {
        showToast(`API Request Failed: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
};

const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    document.querySelectorAll('[data-theme-icon]').forEach(icon => {
        icon.classList.toggle('hidden', icon.dataset.themeIcon !== theme);
    });
};

const getPreferredTheme = () => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme) return storedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
};

const setupThemeToggle = () => {
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleTheme);
    }
    applyTheme(getPreferredTheme());
};

const getUserId = () => {
    let userId = localStorage.getItem('USER_ID');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('USER_ID', userId);
    }
    return userId;
};

const getAvatarUrl = (userId) => {
    const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colorIndex = hash % 5;
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-red-500'];
    const initials = userId.substring(0, 2).toUpperCase();
    return `<div class="w-12 h-12 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-xl">${initials}</div>`;
};

const updateProfileCard = () => {
    const userId = getUserId();
    const profileCard = document.getElementById('user-profile-card-content');
    if (profileCard) {
        profileCard.innerHTML = `
            ${getAvatarUrl(userId)}
            <div class="ml-4">
                <p class="text-xs text-text-secondary">Welcome back,</p>
                <h2 class="text-lg font-semibold text-text-primary">User ${userId.substring(0, 8)}...</h2>
                <p class="text-xs text-text-secondary mt-1">ID: ${userId}</p>
            </div>
        `;
    }
};

const calculateTotal = (category, serviceKey, quantity = 1) => {
    const basePrice = SERVICE_PRICES[category]?.[serviceKey];
    if (basePrice === undefined) return 0;
    return basePrice * quantity;
};

const validatePhone = (number) => /^09\d{9}$/.test(number);
const validateUrl = (url) => /^(https?:\/\/)?(www\.)?([a-zA-Z0-9]+\.)+([a-zA-Z]{2,})(\/[\w.-]*)*\/?$/.test(url);
const validateTransactionId = (id) => id && id.trim().length >= 6;
const validatePositiveNumber = (num) => parseFloat(num) > 0;
const validateRequired = (value) => value && value.trim().length > 0;

const validateField = (input, rules) => {
    const value = input.value;
    const errorElement = document.getElementById(`${input.name}-error`);
    let errorMessage = '';
    let isValid = true;

    if (rules.required && !validateRequired(value)) {
        errorMessage = 'This field is required.';
        isValid = false;
    } else if (rules.type === 'tel' && value && !validatePhone(value)) {
        errorMessage = 'Invalid Myanmar phone number format (09xxxxxxxxx).';
        isValid = false;
    } else if (rules.type === 'url' && value && !validateUrl(value)) {
        errorMessage = 'Invalid URL format.';
        isValid = false;
    } else if (rules.name === 'transactionId' && value && !validateTransactionId(value)) {
        errorMessage = 'Invalid Transaction ID (min 6 chars).';
        isValid = false;
    } else if (rules.minAmount && parseFloat(value) < rules.minAmount) {
        errorMessage = `Minimum amount is ${rules.minAmount.toLocaleString('my-MM')} MMK.`;
        isValid = false;
    } else if (rules.type === 'number' && value && !validatePositiveNumber(value)) {
        errorMessage = 'Amount must be positive.';
        isValid = false;
    }

    if (errorElement) errorElement.textContent = errorMessage;
    input.classList.toggle('border-red-500', !isValid);
    return isValid;
};

const setupFormValidation = (formId, fieldsConfig) => {
    const form = document.getElementById(formId);
    if (!form) return () => true;

    const formFields = fieldsConfig.map(f => ({
        ...f,
        input: form.querySelector(`[name="${f.name}"]`)
    })).filter(f => f.input);

    formFields.forEach(field => {
        field.input.addEventListener('input', () => validateField(field.input, field));
    });

    const isFormValid = () => formFields.every(field => validateField(field.input, field));
    return isFormValid;
};

const handleSubmitOrder = async (event, formId, category, fieldsConfig) => {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('button[type="submit"]');
    if (!button) return;

    const isFormValid = setupFormValidation(formId, fieldsConfig);

    if (!isFormValid()) {
        showToast('Please fix the errors in the form.', 'warning');
        return;
    }

    setLoadingState(button.id, true);

    const formData = Object.fromEntries(new FormData(form).entries());
    const totalAmountElement = document.getElementById(`${category}-total-amount`);
    const totalAmount = parseFloat(totalAmountElement?.dataset.rawTotal || 0);

    const data = {
        userId: getUserId(),
        category,
        totalAmount,
        ...formData
    };

    if (category === 'p2p') {
        data.action = 'submitP2P';
    } else {
        data.action = 'submitOrder';
    }

    try {
        const result = await fetchGas(data.action, data, 'POST');
        if (result.success) {
            showToast(`Order Submitted! ID: ${result.orderId}`, 'success');
            form.reset();
            if (totalAmountElement) totalAmountElement.textContent = 'Total: 0 MMK';
        } else {
            showToast(result.error || 'Order submission failed.', 'error');
        }
    } finally {
        setLoadingState(button.id, false);
    }
};

const setupPriceCalculation = (formId, category, priceDisplayId, quantityId, serviceKeyId) => {
    const form = document.getElementById(formId);
    if (!form) return;

    const updatePriceDisplay = () => {
        const serviceKey = form.querySelector(`[name="${serviceKeyId}"]`)?.value;
        const quantityInput = form.querySelector(`[name="${quantityId}"]`);
        const quantity = parseFloat(quantityInput?.value || 1);
        
        let total = calculateTotal(category, serviceKey, quantity);
        const displayElement = document.getElementById(priceDisplayId);
        
        if (category === 'p2p') {
            const amountSent = parseFloat(form.querySelector('[name="amountSent"]')?.value || 0);
            const feeRate = 0.02;
            const fee = amountSent * feeRate;
            const receiveAmount = amountSent - fee;

            const feeDisplay = document.getElementById('p2p-fee-display');
            const receiveDisplay = document.getElementById('p2p-receive-amount');

            if (feeDisplay) feeDisplay.textContent = `${fee.toLocaleString('my-MM')} MMK (2%)`;
            if (receiveDisplay) receiveDisplay.textContent = receiveAmount > 0 ? `${receiveAmount.toLocaleString('my-MM')} MMK` : '0 MMK';
            
            total = amountSent;
            
        } else if (category === 'smm') {
            const pricePerUnit = SERVICE_PRICES[category]?.[serviceKey] || 0;
            const units = quantity * 100;
            total = pricePerUnit * quantity;
            const unitPriceDisplay = document.getElementById('smm-price-per-unit');
            if (unitPriceDisplay) unitPriceDisplay.textContent = `Price/100 Units: ${pricePerUnit.toLocaleString('my-MM')} MMK`;
        }

        if (displayElement) {
            displayElement.textContent = `Total: ${total.toLocaleString('my-MM')} MMK`;
            displayElement.dataset.rawTotal = total;
        }
    };

    form.addEventListener('input', updatePriceDisplay);
    updatePriceDisplay();
};

const getOrderData = async (action, data = {}) => {
    const result = await fetchGas(action, data);
    return result.success ? result.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
};

const renderOrdersTable = (orders, tableId, isUserHistory) => {
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-text-secondary">No orders found.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        const statusMap = {
            Pending: { class: 'bg-orange-100 text-orange-800', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            Processing: { class: 'bg-blue-100 text-blue-800', icon: 'M4 4v5h.582m15.356 2A8.995 8.995 0 0020 12c0-2.405-.658-4.664-1.802-6.5L14 12V6.5' },
            Success: { class: 'bg-green-100 text-green-800', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            Cancelled: { class: 'bg-red-100 text-red-800', icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
        };
        const statusData = statusMap[order.status] || { class: 'bg-gray-100 text-gray-800', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
        
        const statusHtml = isUserHistory ? `
            <span class="px-2 py-0.5 text-xs font-semibold rounded-full flex items-center ${statusData.class}">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${statusData.icon}" /></svg>
                ${order.status}
            </span>
        ` : `
            <select data-order-id="${order.orderId}" class="status-select p-1 border rounded-lg text-sm bg-bg-primary text-text-primary focus:ring-blue-500 focus:border-blue-500">
                <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Success" ${order.status === 'Success' ? 'selected' : ''}>Success</option>
                <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        `;

        const targetField = order.targetAccount || order.phoneNumber || order.targetLink || 'N/A';
        const formattedAmount = (order.totalAmount || 0).toLocaleString('my-MM') + ' MMK';

        const row = `
            <tr class="border-b border-border-color hover:bg-bg-secondary transition-colors">
                <td class="p-3 text-xs font-medium text-text-primary">${order.orderId}</td>
                ${!isUserHistory ? `<td class="p-3 text-xs text-text-secondary">${order.userId.substring(0, 8)}...</td>` : ''}
                <td class="p-3 text-sm text-text-secondary">${order.category}</td>
                <td class="p-3 text-sm text-text-secondary">${targetField}</td>
                <td class="p-3 text-sm text-text-primary">${formattedAmount}</td>
                <td class="p-3 text-sm text-text-secondary">${order.paymentMethod}</td>
                <td class="p-3">${statusHtml}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
};

const refreshData = async (tableId, isUser, action, category) => {
    const userId = isUser ? getUserId() : 'admin';
    const lastUpdateElement = document.getElementById('last-update-timestamp');

    const data = isUser ? { userId, category } : { category };
    const orders = await getOrderData(action, data);
    
    renderOrdersTable(orders, tableId, isUser);

    if (lastUpdateElement) {
        lastUpdateElement.textContent = new Date().toLocaleTimeString('my-MM');
    }
    return orders;
};

const setupAutoRefresh = (tableId, intervalSeconds, isUser, action = 'list', category = 'All') => {
    const interval = intervalSeconds * 1000;
    const runRefresh = () => refreshData(tableId, isUser, action, category);
    runRefresh();
    setInterval(runRefresh, interval);
    const refreshButton = document.getElementById('manual-refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', runRefresh);
    }
};

const handleAdminUpdateStatus = async (orderId, newStatus) => {
    const data = {
        action: 'adminUpdateStatus',
        orderId,
        newStatus,
        adminId: getUserId()
    };
    try {
        const result = await fetchGas(data.action, data, 'POST');
        if (result.success) {
            showToast(`Order ${orderId} updated to ${newStatus}`, 'success');
            refreshData('admin-orders-table-body', false, 'adminList', 'All');
        } else {
            showToast(result.error || 'Status update failed.', 'error');
        }
    } catch {
        showToast('Admin status update failed due to network error.', 'error');
    }
};

const setupAdminPanel = () => {
    if (document.getElementById('admin-panel')) {
        setupAutoRefresh('admin-orders-table-body', 10, false, 'adminList', 'All');
        
        document.getElementById('admin-orders-table-body')?.addEventListener('change', async (e) => {
            if (e.target.classList.contains('status-select')) {
                const orderId = e.target.dataset.orderId;
                const newStatus = e.target.value;
                await handleAdminUpdateStatus(orderId, newStatus);
            }
        });
        
        document.getElementById('admin-search')?.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#admin-orders-table-body tr');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
            });
        });
    }
};

const setupAccordion = () => {
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = content.classList.contains('active');

            document.querySelectorAll('.accordion-content').forEach(c => {
                c.classList.remove('active');
                c.style.maxHeight = null;
                c.previousElementSibling.querySelector('.accordion-icon').classList.remove('rotate-180');
            });

            if (!isOpen) {
                content.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
                header.querySelector('.accordion-icon').classList.add('rotate-180');
            }
        });
    });
};

const setupCopyButton = (buttonId, targetElementId) => {
    const button = document.getElementById(buttonId);
    const targetElement = document.getElementById(targetElementId);
    if (button && targetElement) {
        button.addEventListener('click', () => {
            const textToCopy = targetElement.textContent.trim();
            const tempInput = document.createElement('textarea');
            tempInput.value = textToCopy;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showToast('Copied to clipboard!', 'success');
        });
    }
};

const setupDashboardStats = async () => {
    const userId = getUserId();
    const result = await fetchGas('stats', { userId });
    if (result.success) {
        document.getElementById('total-orders-stat').textContent = result.data.totalOrders.toLocaleString();
        document.getElementById('total-spent-stat').textContent = result.data.totalSpent.toLocaleString();
        document.getElementById('pending-orders-stat').textContent = result.data.pendingOrders.toLocaleString();
        
        const recentOrders = result.data.recentOrders || [];
        renderOrdersTable(recentOrders.slice(0, 5), 'recent-orders-table-body', true);
    }
};

const setupDashboard = () => {
    if (document.getElementById('main-dashboard')) {
        setupDashboardStats();
        setInterval(setupDashboardStats, 30000);
    }
};

const setupOrderStatusTabs = () => {
    const tabs = document.querySelectorAll('.status-tab');
    const tableBodyId = 'order-history-table-body';
    
    const switchTab = (category) => {
        tabs.forEach(tab => tab.classList.remove('border-primary-color', 'text-primary-color', 'border-b-2'));
        const activeTab = document.querySelector(`.status-tab[data-category="${category}"]`);
        if (activeTab) activeTab.classList.add('border-primary-color', 'text-primary-color', 'border-b-2');
        refreshData(tableBodyId, true, 'list', category);
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.category));
    });

    switchTab('All');
};

const setupPage = () => {
    setupThemeToggle();
    updateProfileCard();
    setupAccordion();
    setupDashboard();
    
    if (document.getElementById('order-status-page')) {
        setupOrderStatusTabs();
        setupAutoRefresh('order-history-table-body', 15, true, 'list', 'All');
    }
    
    if (document.getElementById('admin-panel')) {
        setupAdminPanel();
    }

    if (document.getElementById('sim-form')) {
        const fields = [
            { name: 'targetPhoneNumber', type: 'tel', required: true },
            { name: 'serviceKey', required: true },
            { name: 'paymentMethod', required: true },
            { name: 'transactionId', required: true }
        ];
        setupPriceCalculation('sim-form', 'sim', 'sim-total-amount', 'quantity', 'serviceKey');
        document.getElementById('sim-form').addEventListener('submit', (e) => handleSubmitOrder(e, 'sim-form', 'sim', fields));
    }

    if (document.getElementById('game-form')) {
        const fields = [
            { name: 'targetGameId', required: true },
            { name: 'serviceKey', required: true },
            { name: 'quantity', type: 'number', required: true, minAmount: 1 },
            { name: 'paymentMethod', required: true },
            { name: 'transactionId', required: true }
        ];
        setupPriceCalculation('game-form', 'game', 'game-total-amount', 'quantity', 'serviceKey');
        document.getElementById('game-form').addEventListener('submit', (e) => handleSubmitOrder(e, 'game-form', 'game', fields));
    }

    if (document.getElementById('smm-form')) {
        const fields = [
            { name: 'platform', required: true },
            { name: 'serviceKey', required: true },
            { name: 'targetLink', type: 'url', required: true },
            { name: 'quantity', type: 'number', required: true, minAmount: 1 },
            { name: 'paymentMethod', required: true },
            { name: 'transactionId', required: true }
        ];
        setupPriceCalculation('smm-form', 'smm', 'smm-total-amount', 'quantity', 'serviceKey');
        document.getElementById('smm-form').addEventListener('submit', (e) => handleSubmitOrder(e, 'smm-form', 'smm', fields));
    }

    if (document.getElementById('p2p-form')) {
        const fields = [
            { name: 'exchangeFrom', required: true },
            { name: 'exchangeTo', required: true },
            { name: 'amountSent', type: 'number', required: true, minAmount: MIN_P2P_AMOUNT },
            { name: 'receiveAccountDetails', required: true },
            { name: 'transactionId', required: true }
        ];
        setupPriceCalculation('p2p-form', 'p2p', 'p2p-total-amount', 'quantity', 'serviceKey');
        document.getElementById('p2p-form').addEventListener('submit', (e) => handleSubmitOrder(e, 'p2p-form', 'p2p', fields));
        setupCopyButton('copy-kbzpay', 'kbzpay-account');
        setupCopyButton('copy-kbz-name', 'kbzpay-name');
    }
};

document.addEventListener('DOMContentLoaded', setupPage);
