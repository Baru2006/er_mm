// --- MODULE 1: CONFIGURATION & INITIALIZATION ---
const GAS_URL = 'YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'; // MUST BE UPDATED
const USER_ID_KEY = 'easyrecharge_user_id';
const ADMIN_ID = 'easyrecharge_admin_id_123'; // Admin's unique ID for admin.html access (Optional: could be checked by IP/session on the backend)

// Wait for the DOM to be fully loaded before starting initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Theme
    loadTheme();
    
    // 2. Set up User Session (Authentication is handled by a simple stored ID)
    generateUserID(); 
    
    // 3. Initialize Price Displays on relevant pages
    updatePriceDisplay();
    
    // 4. Start Auto Refresh on relevant pages (Step 18)
    const pathname = window.location.pathname;
    if (pathname.includes('index.html')) {
        startAutoRefresh('dashboard');
    } else if (pathname.includes('status.html')) {
        startAutoRefresh('status');
        document.getElementById('manual-refresh-btn')?.addEventListener('click', () => startAutoRefresh('status', true));
    } else if (pathname.includes('admin.html')) {
        startAutoRefresh('admin');
        document.getElementById('manual-refresh-btn')?.addEventListener('click', () => startAutoRefresh('admin', true));
        document.getElementById('apply-filter-btn')?.addEventListener('click', () => renderAdminDashboard());
    }

    // 5. Initialize Form Listeners (Step 16)
    initFormListeners();

    // 6. Theme Toggle Listener
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
});

// --- MODULE 2: THEME & SESSION MANAGEMENT ---

function loadTheme() {
    const theme = localStorage.getItem('theme') || 'system';
    const html = document.documentElement;

    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        document.querySelectorAll('.theme-icon-light').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.theme-icon-dark').forEach(el => el.classList.remove('hidden'));
    } else {
        html.classList.remove('dark');
        document.querySelectorAll('.theme-icon-dark').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.theme-icon-light').forEach(el => el.classList.remove('hidden'));
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    localStorage.setItem('theme', newTheme);
    loadTheme(); // Re-run loadTheme to apply changes
}

function generateUserID() {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = 'USER-' + crypto.randomUUID().substring(0, 8).toUpperCase();
        localStorage.setItem(USER_ID_KEY, userId);
    }
    document.querySelectorAll('.user-id-display').forEach(el => el.textContent = userId);
}

function getUserId() {
    return localStorage.getItem(USER_ID_KEY);
}

// --- MODULE 3: FORM HANDLING & VALIDATION (Step 16 Update) ---

function initFormListeners() {
    const forms = document.querySelectorAll('form[data-order-type]');
    forms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formId = this.id;
            
            if (validateForm(formId)) {
                await submitOrder(this);
            } else {
                showNotification("Please correct the errors in the form.", 'error');
            }
        });

        // Real-time validation on input change
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', () => validateField(input));
        });
    });

    // P2P Exchange Request Form Listener
    const p2pForm = document.getElementById('p2p-request-form');
    if (p2pForm) {
        p2pForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (validateForm('p2p-request-form')) {
                await submitP2PRequest(this);
            } else {
                showNotification("Please fill in all required fields.", 'error');
            }
        });
    }

    // Listener for service type change to update SMM options (order_smm.html)
    const smmPlatform = document.getElementById('smm-platform');
    if (smmPlatform) {
        smmPlatform.addEventListener('change', updateSMMServiceOptions);
        updateSMMServiceOptions(); // Initial load
    }
}

function updateSMMServiceOptions() {
    const platform = document.getElementById('smm-platform')?.value;
    const serviceSelect = document.getElementById('smm-service');
    if (!serviceSelect) return;

    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    
    let services = [];
    if (platform === 'facebook') {
        services = [
            { id: 'fb-likes', name: 'Facebook Likes (per 100)' },
            { id: 'fb-followers', name: 'Facebook Followers (per 100)' },
            { id: 'fb-views', name: 'Facebook Views (per 100)' },
        ];
    } else if (platform === 'instagram') {
        services = [
            { id: 'ig-followers', name: 'Instagram Followers (per 100)' },
            { id: 'ig-likes', name: 'Instagram Likes (per 100)' },
            { id: 'ig-comments', name: 'Instagram Comments (per 100)' },
        ];
    } else if (platform === 'youtube') {
        services = [
            { id: 'yt-subscribers', name: 'YouTube Subscribers (per 100)' },
            { id: 'yt-views', name: 'YouTube Views (per 100)' },
            { id: 'yt-likes', name: 'YouTube Likes (per 100)' },
        ];
    }

    services.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.name;
        serviceSelect.appendChild(option);
    });
}

// --- VALIDATION FUNCTIONS (Step 16) ---

function validateMyanmarPhone(number) {
    if (!number) return false;
    // Basic check: must start with 09 and be 11 digits long
    return /^(09)\d{9}$/.test(number.replace(/\s/g, ''));
}

function validateURL(url) {
    if (!url) return false;
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;
        const whitelistedDomains = ['facebook.com', 'instagram.com', 'youtube.com', 'm.facebook.com', 'youtu.be'];
        
        // Check if the URL is valid and belongs to a whitelisted domain
        return whitelistedDomains.some(domain => hostname.includes(domain));
    } catch (e) {
        return false;
    }
}

function validateField(inputElement) {
    const value = inputElement.value.trim();
    const name = inputElement.name;
    const errorElement = document.getElementById(`${name}-error`);
    let isValid = true;
    let errorMessage = '';

    // 1. Required Field Check
    if (inputElement.required && !value) {
        isValid = false;
        errorMessage = 'This field is required.';
    } 
    
    // 2. Specific Validation Checks
    else if (name === 'phone_number') {
        if (!validateMyanmarPhone(value)) {
            isValid = false;
            errorMessage = 'Invalid Myanmar phone number (must start with 09 and be 11 digits).';
        }
    } else if (name === 'target_url') {
        if (!validateURL(value)) {
            isValid = false;
            errorMessage = 'Invalid or unsupported social media URL (FB, IG, YT only).';
        }
    } else if (name === 'quantity' || name === 'topup_amount' || name === 'exchange_amount') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue <= 0) {
            isValid = false;
            errorMessage = 'Must be a positive number.';
        } else if (name === 'quantity' && numValue % 1 !== 0) {
             isValid = false;
            errorMessage = 'Quantity must be a whole number.';
        }
    } else if (name === 'tx_id') {
        if (value.length < 5) {
            isValid = false;
            errorMessage = 'Transaction ID must be at least 5 characters long.';
        }
    }

    // 3. Update UI
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.classList.toggle('hidden', isValid);
        inputElement.classList.toggle('border-red-500', !isValid);
    }
    
    return isValid;
}

function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true; // Safety check

    let isFormValid = true;
    
    // Validate all required inputs/selects
    const fieldsToValidate = form.querySelectorAll('input, select');
    fieldsToValidate.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });

    // Check minimum amount for order forms
    const totalAmountEl = form.querySelector('#total-amount-display');
    if (totalAmountEl) {
        const totalAmount = parseFloat(totalAmountEl.dataset.totalAmount) || 0;
        if (!validateMinimumAmount(totalAmount)) {
            isFormValid = false;
            showNotification('Order amount must be at least 1,000 MMK.', 'error');
        }
    }

    return isFormValid;
}

// --- MODULE 4: API INTEGRATION (Step 17 Update) ---

async function apiFetch(endpoint, method = 'GET', data = null) {
    const url = GAS_URL + endpoint;
    const options = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.status === 'error') {
            throw new Error(result.message || 'Backend API error occurred.');
        }

        return result;

    } catch (error) {
        console.error('API Fetch Error:', error);
        showNotification(`API Error: ${error.message || 'Could not connect to the server.'}`, 'error');
        return { status: 'error', message: error.message };
    }
}

async function submitOrder(form) {
    const orderType = form.dataset.orderType;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    showLoading(submitBtn);

    const formData = new FormData(form);
    const data = {
        action: 'submitOrder',
        type: orderType,
        userId: getUserId(),
    };
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Add final calculated amount to data
    const totalAmountEl = document.getElementById('total-amount-display');
    data.amount = parseFloat(totalAmountEl.dataset.totalAmount) || 0;

    const result = await apiFetch('', 'POST', data);

    hideLoading(submitBtn);

    if (result.status === 'success') {
        showNotification(`Order #${result.orderId} submitted successfully! Redirecting...`, 'success');
        setTimeout(() => window.location.href = './status.html', 2000);
    } else {
        showNotification(result.message || 'Order submission failed. Please try again.', 'error');
    }
}

async function submitP2PRequest(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    showLoading(submitBtn);

    const formData = new FormData(form);
    const data = {
        action: 'submitP2PRequest',
        userId: getUserId(),
    };
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }

    const result = await apiFetch('', 'POST', data);

    hideLoading(submitBtn);

    if (result.status === 'success') {
        showNotification(`P2P Exchange Request #${result.orderId} submitted successfully! Please wait for confirmation.`, 'success');
        form.reset();
    } else {
        showNotification(result.message || 'P2P request failed. Please check your inputs.', 'error');
    }
}

async function fetchOrders(action = 'list', params = {}) {
    let endpoint = `?action=${action}`;
    
    // Add user ID if not admin action
    if (action === 'list' || action === 'stats') {
        endpoint += `&userId=${getUserId()}`;
    }

    // Add other params (like filters for admin)
    for (const key in params) {
        if (params[key]) {
            endpoint += `&${key}=${encodeURIComponent(params[key])}`;
        }
    }
    
    const result = await apiFetch(endpoint, 'GET');
    return result.status === 'success' ? result.data : null;
}

async function updateOrderStatus(orderId, newStatus) {
    const data = {
        action: 'updateStatus',
        orderId: orderId,
        newStatus: newStatus,
        adminId: getUserId(), // For backend check
    };
    
    const result = await apiFetch('', 'POST', data);
    
    if (result.status === 'success') {
        showNotification(`Order #${orderId} status updated to ${newStatus}.`, 'success');
        // Manually refresh dashboard after update
        renderAdminDashboard(); 
    } else {
        showNotification(result.message || 'Failed to update status.', 'error');
    }
}


// --- MODULE 5: UI UTILITIES & HELPERS ---

function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.textContent = message;
    
    // Set colors based on type
    toast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl text-white shadow-lg transition-opacity duration-300 z-50';
    if (type === 'success') {
        toast.classList.add('bg-green-500');
    } else if (type === 'error') {
        toast.classList.add('bg-red-500');
    } else { // info/default
        toast.classList.add('bg-indigo-500');
    }
    
    // Show and hide
    toast.classList.remove('opacity-0');
    setTimeout(() => {
        toast.classList.add('opacity-0');
    }, 4000);
}

function showLoading(buttonElement) {
    buttonElement.dataset.originalText = buttonElement.textContent.trim();
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';
}

function hideLoading(buttonElement) {
    buttonElement.disabled = false;
    buttonElement.innerHTML = buttonElement.dataset.originalText;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'MMK', 
        minimumFractionDigits: 0,
        currencyDisplay: 'symbol'
    }).format(amount).replace('MMK', ' MMK');
}

function getServiceMetadata(order) {
    let serviceName = order.service;
    let type = order.type;
    let amount = order.amount;

    if (type === 'SIM') {
        serviceName = order.service_option;
    } else if (type === 'P2P') {
        serviceName = 'P2P Exchange';
    } else if (type === 'SMM') {
        const units = order.quantity * 100;
        serviceName = `${serviceName} (${units} units)`;
    }
    
    return { serviceName, amount };
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'Success':
        case 'P2P Completed':
            return 'badge-success';
        case 'Processing':
            return 'badge-processing';
        case 'Cancelled':
            return 'badge-cancelled';
        case 'P2P Pending':
            return 'badge-info';
        case 'Pending':
        default:
            return 'badge-pending';
    }
}

// --- MODULE 6: PRICE CONFIGURATION (Step 15) ---

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
    'fb-likes': 2000,       // Price per 100 units
    'fb-followers': 4000,   // Price per 100 units
    'fb-views': 1500,       // Price per 100 units
    'ig-followers': 4000,
    'ig-likes': 2000,
    'ig-comments': 3000,
    'yt-subscribers': 8000,
    'yt-views': 2500,
    'yt-likes': 1500
  }
};

function calculateTotal(category, service, quantity) {
    if (!SERVICE_PRICES[category] || !SERVICE_PRICES[category][service]) {
        console.warn(`Price not found for category: ${category}, service: ${service}`);
        return 0;
    }

    const pricePerUnit = SERVICE_PRICES[category][service];
    
    if (category === 'smm') {
        // SMM is priced per 100 units (quantity is in hundreds)
        return pricePerUnit * quantity;
    } 
    
    // For SIM and Game, quantity is implicitly 1 for the selected package
    return pricePerUnit * quantity;
}

function calculateP2PExchange(amount) {
    // 2% fee
    const feeRate = 0.02; 
    const fee = amount * feeRate;
    const finalAmount = amount - fee;
    return { fee, finalAmount };
}

function updatePriceDisplay() {
    const form = document.querySelector('form[data-order-type]');
    const totalDisplay = document.getElementById('total-amount-display');

    if (!form || !totalDisplay) return;

    let category = form.dataset.orderType.toLowerCase();
    let service, quantity;
    let total = 0;
    
    // Determine service and quantity based on the form type
    if (category === 'sim') {
        service = document.getElementById('sim-service-option')?.value;
        quantity = 1; // Assuming 1 recharge package per order
    } else if (category === 'game') {
        service = document.getElementById('game-package')?.value;
        quantity = parseFloat(document.getElementById('quantity')?.value) || 0;
    } else if (category === 'smm') {
        service = document.getElementById('smm-service')?.value;
        quantity = parseFloat(document.getElementById('quantity')?.value) || 0;
    } else if (category === 'p2p') {
        const amountInput = document.getElementById('exchange_amount');
        const amount = parseFloat(amountInput?.value) || 0;
        const result = calculateP2PExchange(amount);

        // Update P2P specific displays
        document.getElementById('final-amount-display').textContent = formatCurrency(result.finalAmount);
        document.getElementById('fee-amount-display').textContent = formatCurrency(result.fee);
        
        total = amount; // P2P total refers to the initial amount for minimum check
    }

    if (category !== 'p2p' && service && quantity > 0) {
        total = calculateTotal(category, service, quantity);
    }
    
    totalDisplay.textContent = formatCurrency(total);
    totalDisplay.dataset.totalAmount = total;

    // Revalidate form on price update
    validateForm(form.id); 
}

function validateMinimumAmount(amount) {
    const MIN_AMOUNT = 1000;
    return amount >= MIN_AMOUNT;
}

// Attach listeners to relevant inputs for price calculation (needs to be done outside DOMContentLoaded)
['sim-service-option', 'game-package', 'quantity', 'smm-service', 'smm-platform', 'exchange_amount'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updatePriceDisplay);
});


// --- MODULE 7: REAL-TIME STATUS & RENDERING (Step 18 Update) ---

let refreshIntervalId = null;
let lastOrdersData = null; // Cache last fetched data for admin panel new order check

function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}

function startAutoRefresh(pageType, manual = false) {
    stopAutoRefresh(); // Stop any existing timer

    let interval = 0;
    let renderFunction = null;

    if (pageType === 'dashboard') {
        interval = 30000; // 30 seconds
        renderFunction = renderDashboardStats;
    } else if (pageType === 'status') {
        interval = 15000; // 15 seconds
        renderFunction = renderUserStatus;
    } else if (pageType === 'admin') {
        interval = 10000; // 10 seconds
        renderFunction = renderAdminDashboard;
    }
    
    if (renderFunction) {
        // Execute immediately, especially for manual refresh
        if (manual) {
            showNotification(`Refreshing ${pageType} data...`, 'info');
        }
        renderFunction(); 
        
        // Start interval if not manual
        if (!manual) {
            refreshIntervalId = setInterval(renderFunction, interval);
        }
    }
}

function updateLastRefreshTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('last-refresh')?.textContent = `Last refreshed: ${timeString}`;
}

async function renderDashboardStats() {
    updateLastRefreshTimestamp();
    const stats = await fetchOrders('stats');
    
    if (stats) {
        document.getElementById('stat-orders')?.textContent = stats.totalOrders.toLocaleString();
        document.getElementById('stat-spent')?.textContent = formatCurrency(stats.totalSpent);
        document.getElementById('stat-pending')?.textContent = stats.pendingCount.toLocaleString();

        // Render recent orders list (index.html)
        const recentOrders = await fetchOrders('list');
        if (recentOrders) {
            const listContainer = document.getElementById('recent-orders-list');
            if (listContainer) {
                listContainer.innerHTML = ''; // Clear existing list
                
                recentOrders.slice(0, 5).forEach(order => {
                    const { serviceName, amount } = getServiceMetadata(order);
                    const listItem = document.createElement('div');
                    listItem.className = 'flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-b-0';
                    listItem.innerHTML = `
                        <div class="text-sm">
                            <span class="font-medium text-gray-800 dark:text-gray-200">${serviceName}</span>
                            <span class="text-xs ${getStatusBadgeClass(order.status)} ml-2">${order.status}</span>
                        </div>
                        <span class="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">${formatCurrency(amount)}</span>
                    `;
                    listContainer.appendChild(listItem);
                });
            }
        }
    }
}

async function renderUserStatus() {
    updateLastRefreshTimestamp();
    const orders = await fetchOrders('list');
    const tableBody = document.getElementById('status-table-body');
    const filterTab = document.querySelector('.status-filter-tab.active')?.dataset.status || 'All';
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500 dark:text-gray-400">No orders found.</td></tr>`;
        return;
    }

    const filteredOrders = orders.filter(order => filterTab === 'All' || order.status === filterTab);

    if (filteredOrders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-gray-500 dark:text-gray-400">No ${filterTab} orders found.</td></tr>`;
        return;
    }

    filteredOrders.forEach(order => {
        const { serviceName, amount } = getServiceMetadata(order);
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${order.orderId}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">${serviceName}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">${order.target || order.target_url || '-'}</td>
            <td class="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">${formatCurrency(amount)}</td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">${new Date(order.timestamp).toLocaleString()}</td>
            <td class="px-4 py-3 text-center">
                <span class="text-xs font-semibold ${getStatusBadgeClass(order.status)}">${order.status}</span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}


async function renderAdminDashboard() {
    updateLastRefreshTimestamp();
    const tableBody = document.getElementById('order-list');
    const loadingSpinner = document.getElementById('loading-spinner');
    const noOrdersMessage = document.getElementById('no-orders-message');

    if (!tableBody || !loadingSpinner) return;

    loadingSpinner.classList.remove('hidden');
    tableBody.innerHTML = ''; // Clear table
    noOrdersMessage.classList.add('hidden');

    const searchInput = document.getElementById('search-input')?.value.trim();
    const filterStatus = document.getElementById('filter-status')?.value;
    const filterService = document.getElementById('filter-service')?.value;

    const filters = {
        status: filterStatus,
        service: filterService,
        search: searchInput,
    };
    
    const orders = await fetchOrders('admin', filters);
    
    loadingSpinner.classList.add('hidden');

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '';
        noOrdersMessage.classList.remove('hidden');
        return;
    }

    // New Order Logic (Step 18)
    const now = Date.now();
    const NEW_ORDER_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    orders.forEach(order => {
        const { serviceName, amount } = getServiceMetadata(order);
        const isNew = (now - new Date(order.timestamp).getTime()) < NEW_ORDER_THRESHOLD;
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150';

        const statusOptions = ['Pending', 'Processing', 'Success', 'Cancelled'];
        // Add P2P specific options if it is a P2P order
        if (order.type === 'P2P') {
            statusOptions.push('P2P Pending', 'P2P Completed');
        }
        
        const statusDropdown = `
            <select onchange="updateOrderStatus('${order.orderId}', this.value)" class="form-select status-dropdown" data-order-id="${order.orderId}">
                ${statusOptions.map(s => 
                    `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`
                ).join('')}
            </select>
        `;

        row.innerHTML = `
            <td class="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">
                ${order.orderId} ${isNew ? '<span class="badge-success ml-1 text-xs">NEW</span>' : ''}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                <span class="font-bold">${order.userId}</span><br>
                <span class="text-xs text-indigo-500">${order.type} - ${order.service}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                ${order.target || order.target_url || '-'}
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                ${formatCurrency(amount)}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                ${order.paymentMethod || '-'} / ${order.txId || '-'}
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
                ${new Date(order.timestamp).toLocaleString()}
            </td>
            <td class="px-4 py-3 text-center">
                <span class="text-xs font-semibold ${getStatusBadgeClass(order.status)} block mb-2">${order.status}</span>
                ${statusDropdown}
            </td>
            <td class="px-4 py-3 text-center">
                <button onclick="copyToClipboard('${order.target || order.target_url}')" class="text-xs text-indigo-500 hover:text-indigo-700 font-medium">Copy Target</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    lastOrdersData = orders; // Cache current data
}

// Global utility for easy text copying (for admin panel)
function copyToClipboard(text) {
    if (typeof document.execCommand === 'function') {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showNotification('Copied to clipboard!', 'info');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showNotification('Failed to copy text.', 'error');
        }
        document.body.removeChild(textarea);
    }
                                              }
