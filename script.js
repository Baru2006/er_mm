/*
 * ----------------------------------------------------
 * EasyRecharge-MM Project - script.js
 * Frontend Logic, API Integration, and Session Management
 * ----------------------------------------------------
 */

// ⚙️ CONFIGURATION
const GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; 
// !!! NOTE: Replace 'YOUR_SCRIPT_ID' with your actual deployed Google Apps Script URL

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
        'fb-likes': 2000, // Price per 100 units
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

const ADMIN_PASSWORD = 'EasyAdmin2025'; // Admin password for local check (should be highly complex)


// ----------------------------------------------------
// I. UTILITY FUNCTIONS (Toast & Formatting)
// ----------------------------------------------------

/** Displays a toast notification (Success/Error). */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type} ${type === 'success' ? 'bg-success' : 'bg-error'} transition-opacity`;
    toast.textContent = message;
    
    // Add to DOM and fade in
    container.prepend(toast);
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 50); 

    // Fade out and remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

/** Formats number to MMK currency string. */
function formatMMK(amount) {
    if (isNaN(amount) || amount === null) return '0 MMK';
    return new Intl.NumberFormat('my-MM', {
        style: 'currency',
        currency: 'MMK',
        minimumFractionDigits: 0
    }).format(amount).replace('MMK', ' MMK');
}

// ----------------------------------------------------
// II. SESSION MANAGEMENT (User ID and Admin)
// ----------------------------------------------------

/** Gets or creates a User ID. */
function getUserId() {
    let userId = localStorage.getItem('easyrecharge_user_id');
    if (!userId) {
        // Simple unique ID generation (timestamp + random number)
        userId = 'USR-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 6).toUpperCase();
        localStorage.setItem('easyrecharge_user_id', userId);
    }
    return userId;
}

/** Checks if the user is an admin. */
function isAdmin() {
    return localStorage.getItem('easyrecharge_is_admin') === 'true';
}

/** Logs in or out the admin session. */
function setAdminSession(status) {
    if (status) {
        localStorage.setItem('easyrecharge_is_admin', 'true');
    } else {
        localStorage.removeItem('easyrecharge_is_admin');
    }
    // Update UI elements based on session
    checkAdminAccess();
}

/** Checks for admin session and updates links/views. */
function checkAdminAccess() {
    const adminLinkIds = ['admin-nav-link', 'mobile-admin-nav-link', 'footer-admin-link', 'footer-admin-link-2'];
    adminLinkIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('hidden', !isAdmin());
        }
    });

    // Admin Panel View Toggle
    const dashboardView = document.getElementById('admin-dashboard-view');
    const loginView = document.getElementById('admin-login-view');
    if (document.title.includes('Admin Panel')) {
        if (isAdmin()) {
            if(dashboardView) dashboardView.classList.remove('hidden');
            if(loginView) loginView.classList.add('hidden');
            loadAdminData(); // Load data immediately on successful check
            startAdminAutoRefresh();
        } else {
            if(dashboardView) dashboardView.classList.add('hidden');
            if(loginView) loginView.classList.remove('hidden');
        }
    }
}

// ----------------------------------------------------
// III. API INTEGRATION (GAS Backend)
// ----------------------------------------------------

/** Generic function to send data to GAS. */
async function sendToGAS(payload, method = 'POST') {
    const url = GAS_URL + (method === 'GET' ? '?' + new URLSearchParams(payload).toString() : '');
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: method === 'POST' ? JSON.stringify(payload) : null,
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.status === 'error') {
            throw new Error(result.message || 'Server-side error occurred.');
        }
        return result;

    } catch (error) {
        console.error("GAS API Error:", error);
        showToast(error.message || 'ကွန်ရက် သို့မဟုတ် ဆာဗာ ပြဿနာ ဖြစ်ပေါ်ပါသည်။', 'error');
        return { status: 'error', message: error.message };
    }
}


// ----------------------------------------------------
// IV. FORM LOGIC & CALCULATION (SIM, Game, SMM, P2P)
// ----------------------------------------------------

/** Calculates price for SIM/Game/SMM and updates display. */
function calculatePrice(type, formId, serviceId, quantityId, priceDisplayId, extraDisplayId = null) {
    const form = document.getElementById(formId);
    if (!form) return;

    const serviceKey = form.querySelector(`#${serviceId}`)?.value;
    const quantity = parseFloat(form.querySelector(`#${quantityId}`)?.value) || 0;
    const priceDisplay = form.querySelector(`#${priceDisplayId}`);
    const submitBtn = form.querySelector('button[type="submit"]');

    let unitPrice = 0;
    let total = 0;
    
    if (serviceKey && SERVICE_PRICES[type][serviceKey]) {
        unitPrice = SERVICE_PRICES[type][serviceKey];
        total = unitPrice * quantity;
    }

    if (priceDisplay) {
        priceDisplay.textContent = formatMMK(total);
    }
    
    // SMM specific display
    if (type === 'smm' && extraDisplayId) {
        const extraDisplay = form.querySelector(`#${extraDisplayId}`);
        if (extraDisplay) {
             extraDisplay.textContent = serviceKey 
                ? `စျေးနှုန်း: ${formatMMK(unitPrice)} (၁၀၀ ယူနစ် အတွက်)` 
                : 'စျေးနှုန်း: 0 MMK (၁၀၀ ယူနစ် အတွက်)';
        }
    }

    // Enable/Disable submit button
    if (submitBtn) {
        const isValid = form.checkValidity() && total > 0;
        submitBtn.disabled = !isValid;
    }
    return total;
}

/** Populates SMM service dropdown based on platform. */
function updateSMMServiceOptions() {
    const platform = document.getElementById('smm-platform').value;
    const serviceSelect = document.getElementById('smm-service');
    
    serviceSelect.innerHTML = '<option value="" disabled selected>ဝန်ဆောင်မှု အမျိုးအစားကို ရွေးချယ်ပါ</option>';
    serviceSelect.disabled = true;

    const optionsMap = {
        'facebook': {
            'fb-likes': 'Facebook Likes',
            'fb-followers': 'Facebook Followers',
            'fb-views': 'Facebook Views'
        },
        'instagram': {
            'ig-followers': 'Instagram Followers',
            'ig-likes': 'Instagram Likes',
            'ig-comments': 'Instagram Comments'
        },
        'youtube': {
            'yt-subscribers': 'YouTube Subscribers',
            'yt-views': 'YouTube Views',
            'yt-likes': 'YouTube Likes'
        }
    };

    if (platform && optionsMap[platform]) {
        for (const [key, label] of Object.entries(optionsMap[platform])) {
            const price = SERVICE_PRICES.smm[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${label} (${formatMMK(price)} / 100 units)`;
            serviceSelect.appendChild(option);
        }
        serviceSelect.disabled = false;
    }
    // Recalculate SMM price after options change
    calculatePrice('smm', 'smm-order-form', 'smm-service', 'smm-quantity', 'smm-total-price', 'smm-price-per-unit');
}

/** P2P Fee Calculation. */
function calculateP2P() {
    const amountInput = document.getElementById('p2p-amount');
    const amount = parseFloat(amountInput?.value) || 0;
    const feeDisplay = document.getElementById('p2p-fee');
    const receiveDisplay = document.getElementById('p2p-receive-amount');
    const submitBtn = document.getElementById('p2p-submit-btn');
    const form = document.getElementById('p2p-exchange-form');

    const FEE_RATE = 0.02; // 2%
    let fee = 0;
    let receive = 0;

    if (amount >= 1000) {
        fee = amount * FEE_RATE;
        receive = amount - fee;
    }
    
    if (feeDisplay) feeDisplay.textContent = formatMMK(fee);
    if (receiveDisplay) receiveDisplay.textContent = formatMMK(receive);
    
    // Enable/Disable submit button
    if (submitBtn) {
        const isValid = form.checkValidity() && receive > 0;
        submitBtn.disabled = !isValid;
    }
}


// ----------------------------------------------------
// V. ORDER SUBMISSION HANDLERS
// ----------------------------------------------------

/** Generic submission handler for order forms. */
async function handleSubmitOrder(event, orderType, totalFieldId, targetFieldId) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const loadingIcon = form.querySelector('.fa-spin');
    const total = parseFloat(form.querySelector(`#${totalFieldId}`).textContent.replace(/[^\d]/g, '')) || 0;
    
    if (total <= 0) {
        showToast('ကျေးဇူးပြု၍ ဝန်ဆောင်မှုနှင့် ပမာဏကို ရွေးချယ်ပါ', 'error');
        return;
    }

    submitBtn.disabled = true;
    loadingIcon?.classList.remove('hidden');

    const formData = new FormData(form);
    const payload = {
        action: 'submitOrder',
        type: orderType,
        userId: getUserId(),
        total: total,
        ...Object.fromEntries(formData.entries())
    };

    // Clean up unnecessary keys for specific orders (e.g., P2P doesn't need 'total')
    if (orderType === 'p2p') delete payload.total;

    const result = await sendToGAS(payload, 'POST');

    loadingIcon?.classList.add('hidden');
    submitBtn.disabled = false;
    
    if (result.status === 'success') {
        showToast(`အော်ဒါ #${result.orderId} တင်သွင်းမှု အောင်မြင်ပါပြီ။`, 'success');
        form.reset(); // Clear form on success
        // Redirect to status page after a delay
        setTimeout(() => window.location.href = 'status.html', 1500); 
    } else {
        submitBtn.disabled = false;
        showToast(result.message || 'အော်ဒါတင်ရာတွင် အမှားတစ်ခုခုရှိနေပါသည်။', 'error');
    }
}


// ----------------------------------------------------
// VI. ADMIN LOGIC (Login & Data Update)
// ----------------------------------------------------

/** Handles Admin Login Form Submission. */
function handleAdminLogin(event) {
    event.preventDefault();
    const password = document.getElementById('admin-pass').value;
    if (password === ADMIN_PASSWORD) {
        setAdminSession(true);
        showToast('Admin ဝင်ရောက်မှု အောင်မြင်ပါပြီ။', 'success');
        // checkAdminAccess will be called via setAdminSession
    } else {
        showToast('စကားဝှက် မမှန်ပါ။', 'error');
    }
}

/** Admin Auto-refresh interval ID. */
let adminRefreshInterval;

/** Starts the Admin Panel auto-refresh. */
function startAdminAutoRefresh() {
    if (adminRefreshInterval) clearInterval(adminRefreshInterval);
    adminRefreshInterval = setInterval(loadAdminData, 10000); // 10 seconds refresh
}

/** Loads and updates data in the Admin Panel. */
async function loadAdminData() {
    if (!isAdmin()) return;

    const tbody = document.getElementById('admin-orders-body');
    const timestampEl = document.getElementById('last-update-time');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-primary"><i class="fas fa-sync-alt fa-spin mr-2"></i> ဒေတာများ ပြန်လည်ယူနေပါသည်...</td></tr>';
    
    const filter = document.getElementById('admin-status-filter')?.value || 'ALL';
    const query = document.getElementById('admin-search-query')?.value || '';

    const result = await sendToGAS({ action: 'getAdminOrders', filter: filter, query: query }, 'GET');
    
    if (result.status === 'success' && result.data) {
        tbody.innerHTML = '';
        if (result.data.orders.length === 0) {
             tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-gray-500">ရှာဖွေမှုနှင့် ကိုက်ညီသော အော်ဒါ မရှိပါ</td></tr>';
        } else {
             result.data.orders.forEach(order => {
                tbody.appendChild(createAdminRow(order));
            });
        }
        
        // Update Stats
        document.getElementById('count-pending').textContent = result.data.stats.Pending || 0;
        document.getElementById('count-processing').textContent = result.data.stats.Processing || 0;
        document.getElementById('count-success').textContent = result.data.stats.Success || 0;
        document.getElementById('count-total').textContent = result.data.stats.Total || 0;
        
        // Update Timestamp
        timestampEl.textContent = `နောက်ဆုံး အချက်အလက် တင်ချိန်: ${new Date().toLocaleTimeString('en-US')}`;

    } else if (result.status !== 'error') {
         tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-error">ဒေတာများ ယူရာတွင် အမှားဖြစ်ပွားသည်။</td></tr>';
    }
}

/** Creates a single row for the Admin Order Table. */
function createAdminRow(order) {
    const row = document.createElement('tr');
    
    // Determine status badge class
    let badgeClass = 'pending';
    if (order.Status === 'Processing') badgeClass = 'processing';
    if (order.Status === 'Success') badgeClass = 'success';
    if (order.Status === 'Cancelled') badgeClass = 'cancelled';
    
    // Simplified target info display
    let targetInfo = order.Target || order['Account Details'] || order.Link || order.Phone || 'N/A';
    if (order.Service === 'P2P') {
        targetInfo = `${order.From} -> ${order.To} (${order['Amount Sent']} MMK)`;
    }
    
    row.innerHTML = `
        <td>${order['Order ID']} ${order.isNew ? '<span class="status-badge bg-red-500 text-white ml-2">NEW</span>' : ''}</td>
        <td>${order.Service}</td>
        <td class="text-sm">${targetInfo}</td>
        <td>${formatMMK(order.Total || order['Amount Sent'])}</td>
        <td class="text-xs">${order['Transaction ID'] || 'N/A'}</td>
        <td><span class="status-badge ${badgeClass}">${order.Status}</span></td>
        <td>
            <select data-order-id="${order['Order ID']}" data-sheet="${order.Sheet}" onchange="updateAdminStatus(this)" class="form-input p-2 text-sm w-32">
                <option value="Pending" ${order.Status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Processing" ${order.Status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Success" ${order.Status === 'Success' ? 'selected' : ''}>Success</option>
                <option value="Cancelled" ${order.Status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
        </td>
    `;
    return row;
}

/** Handles status update from Admin Panel dropdown. */
async function updateAdminStatus(selectElement) {
    const orderId = selectElement.dataset.orderId;
    const sheetName = selectElement.dataset.sheet;
    const newStatus = selectElement.value;

    const result = await sendToGAS({
        action: 'updateStatus',
        orderId: orderId,
        sheetName: sheetName,
        status: newStatus
    }, 'POST');

    if (result.status === 'success') {
        showToast(`အော်ဒါ #${orderId} အခြေအနေကို ${newStatus} သို့ ပြောင်းလဲပြီးပါပြီ။`, 'success');
        loadAdminData(); // Refresh data to update counts
    } else {
        showToast('အခြေအနေ ပြောင်းလဲရာတွင် အမှားဖြစ်ပွားသည်', 'error');
        // Revert select option on failure
        loadAdminData();
    }
}


// ----------------------------------------------------
// VII. ORDER STATUS LOGIC (User View)
// ----------------------------------------------------

/** Loads the current user's order history. */
async function loadUserOrderHistory(filterType = 'all') {
    const tbody = document.getElementById('order-history-body');
    const timestampEl = document.getElementById('last-update-timestamp');
    if (!tbody) return;

    const filterStatus = document.getElementById('order-status-filter')?.value || 'ALL';
    const searchQuery = document.getElementById('order-search-input')?.value || '';

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-primary"><i class="fas fa-sync-alt fa-spin mr-2"></i> မှတ်တမ်းများ ယူနေပါသည်...</td></tr>';

    const payload = {
        action: 'getUserOrders',
        userId: getUserId(),
        filterType: filterType,
        filterStatus: filterStatus,
        searchQuery: searchQuery
    };

    const result = await sendToGAS(payload, 'GET');
    
    if (result.status === 'success' && result.data) {
        tbody.innerHTML = '';
        if (result.data.orders.length === 0) {
            document.getElementById('no-history-message').classList.remove('hidden');
        } else {
            document.getElementById('no-history-message').classList.add('hidden');
            result.data.orders.forEach(order => {
                tbody.appendChild(createUserOrderRow(order));
            });
        }
        timestampEl.textContent = `နောက်ဆုံး အချက်အလက် တင်ချိန်: ${new Date().toLocaleTimeString('en-US')}`;

    } else if (result.status !== 'error') {
         tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-error">မှတ်တမ်းများ ယူရာတွင် အမှားဖြစ်ပွားသည်။</td></tr>';
    }
}

/** Creates a single row for the User Order Table. */
function createUserOrderRow(order) {
    const row = document.createElement('tr');
    
    let badgeClass = 'pending';
    if (order.Status === 'Processing') badgeClass = 'processing';
    if (order.Status === 'Success') badgeClass = 'success';
    if (order.Status === 'Cancelled') badgeClass = 'cancelled';
    
    let targetInfo = order.Target || order['Account Details'] || order.Link || order.Phone || 'N/A';
    
    row.innerHTML = `
        <td>${order['Order ID']}</td>
        <td>${order.Service}</td>
        <td class="text-sm">${targetInfo}</td>
        <td>${formatMMK(order.Total || order['Amount Sent'])}</td>
        <td class="text-xs">${order.Timestamp.split(' ')[0]}</td>
        <td><span class="status-badge ${badgeClass}">${order.Status}</span></td>
    `;
    return row;
}

/** Initializes auto-refresh for user status page. */
function startUserAutoRefresh() {
    const tabButton = document.querySelector('.tab-button.active-tab');
    const filterType = tabButton ? tabButton.dataset.tab : 'all';
    loadUserOrderHistory(filterType);
    setInterval(() => {
        loadUserOrderHistory(filterType);
    }, 15000); // 15 seconds refresh
}

// ----------------------------------------------------
// VIII. INITIALIZATION & EVENT LISTENERS
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Setup
    const userId = getUserId();
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
         // Display a simplified User ID or a default name
        userNameEl.textContent = userId.slice(0, 3) + '...' + userId.slice(-4); 
    }
    
    checkAdminAccess(); // Check admin status and update UI

    // 2. Event Listeners for Forms (Sim, Game, SMM, P2P)
    
    // SIM Recharge
    document.getElementById('sim-recharge-form')?.addEventListener('input', () => {
        calculatePrice('sim', 'sim-recharge-form', 'sim-service', 'sim-quantity', 'sim-total-price');
    });
    document.getElementById('sim-recharge-form')?.addEventListener('submit', (e) => {
        handleSubmitOrder(e, 'SIM', 'sim-total-price', 'sim-phone');
    });
    
    // Game Top-up (Quantity input is used for quantityId)
    document.getElementById('game-topup-form')?.addEventListener('input', () => {
        calculatePrice('game', 'game-topup-form', 'game-service', 'game-quantity', 'game-total-price');
    });
    document.getElementById('game-topup-form')?.addEventListener('submit', (e) => {
        handleSubmitOrder(e, 'Game', 'game-total-price', 'game-id');
    });

    // SMM Services
    document.getElementById('smm-platform')?.addEventListener('change', updateSMMServiceOptions);
    document.getElementById('smm-order-form')?.addEventListener('input', () => {
        calculatePrice('smm', 'smm-order-form', 'smm-service', 'smm-quantity', 'smm-total-price', 'smm-price-per-unit');
    });
    document.getElementById('smm-order-form')?.addEventListener('submit', (e) => {
        handleSubmitOrder(e, 'SMM', 'smm-total-price', 'smm-link');
    });

    // P2P Exchange
    document.getElementById('p2p-amount')?.addEventListener('input', calculateP2P);
    document.getElementById('p2p-exchange-form')?.addEventListener('input', calculateP2P);
    document.getElementById('p2p-exchange-form')?.addEventListener('submit', (e) => {
        handleSubmitOrder(e, 'P2P', 'p2p-receive-amount', 'p2p-account-details'); 
    });


    // 3. Admin Panel Listeners
    document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
        setAdminSession(false);
        if (adminRefreshInterval) clearInterval(adminRefreshInterval);
        showToast('Admin မှ ထွက်ပြီးပါပြီ။', 'success');
        window.location.href = 'index.html';
    });
    document.getElementById('admin-status-filter')?.addEventListener('change', loadAdminData);
    document.getElementById('admin-search-query')?.addEventListener('input', debounce(loadAdminData, 500));
    
    
    // 4. Order Status Page Listeners
    if (document.title.includes('အော်ဒါ အခြေအနေ')) {
        startUserAutoRefresh(); // Initial load and start refresh
        document.getElementById('refresh-button')?.addEventListener('click', () => loadUserOrderHistory(document.querySelector('.tab-button.active-tab').dataset.tab));
        document.getElementById('order-status-filter')?.addEventListener('change', () => loadUserOrderHistory(document.querySelector('.tab-button.active-tab').dataset.tab));
        document.getElementById('order-search-input')?.addEventListener('input', debounce(() => loadUserOrderHistory(document.querySelector('.tab-button.active-tab').dataset.tab), 500));
        
        // Tab switching logic for status page
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function() {
                // UI update already handled in chunk 4 inline script
                loadUserOrderHistory(this.dataset.tab);
            });
        });
    }

    // 5. Dashboard Stats Load (index.html)
    if (document.title.includes('ပင်မ စီမံခန့်ခွဲမှု')) {
        loadDashboardStats();
        loadRecentOrders();
        // Logout button listener for dashboard
        document.getElementById('logout-button')?.addEventListener('click', () => {
            setAdminSession(false); // In case they were logged in as admin
            localStorage.removeItem('easyrecharge_user_id'); // Clear user ID to simulate full logout
            showToast('အကောင့်မှ ထွက်ပြီးပါပြီ။', 'success');
            setTimeout(() => window.location.reload(), 500);
        });
    }
});


/** Loads Dashboard Stats (Total Orders, Total Spent, Pending Orders) */
async function loadDashboardStats() {
    const result = await sendToGAS({ action: 'getDashboardStats', userId: getUserId() }, 'GET');
    if (result.status === 'success' && result.data) {
        document.getElementById('stat-total-orders').textContent = result.data.totalOrders || 0;
        document.getElementById('stat-total-spent').textContent = formatMMK(result.data.totalSpent || 0);
        document.getElementById('stat-pending-orders').textContent = result.data.pendingOrders || 0;
    }
}

/** Loads Last 5 Orders for Dashboard */
async function loadRecentOrders() {
    const tbody = document.getElementById('recent-orders-body');
    if (!tbody) return;

    const result = await sendToGAS({ action: 'getUserOrders', userId: getUserId(), limit: 5 }, 'GET');
    
    if (result.status === 'success' && result.data && result.data.orders) {
        tbody.innerHTML = '';
        if (result.data.orders.length === 0) {
             tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-gray-500">နောက်ဆုံး အော်ဒါ မရှိသေးပါ</td></tr>';
        } else {
             result.data.orders.forEach(order => {
                tbody.appendChild(createDashboardOrderRow(order));
            });
        }
    }
}

/** Creates a single row for the Dashboard Recent Order Table. */
function createDashboardOrderRow(order) {
    const row = document.createElement('tr');
    let badgeClass = order.Status === 'Success' ? 'success' : (order.Status === 'Pending' ? 'pending' : 'processing');
    
    row.innerHTML = `
        <td>${order['Order ID']}</td>
        <td>${order.Service}</td>
        <td>${formatMMK(order.Total || order['Amount Sent'])}</td>
        <td class="text-xs">${order.Timestamp.split(' ')[0]}</td>
        <td><span class="status-badge ${badgeClass}">${order.Status}</span></td>
    `;
    return row;
}


// Utility for debouncing search inputs
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
                            }
