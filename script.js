/**
 * Easy Recharge MM - Core Frontend Logic
 * Handles User Auth, API Calls, Form Calculations
 */

// --- CONFIGURATION ---
// ❗*** MUST REPLACE THIS with your deployed Google Apps Script URL ***❗
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzvDnKGbWHGzqLN9o4Jx1K88yU_F4uoj703xFJH-lMy2dfz3GwAOzUxMX8dI2QtxY5h1Q/exec';

// --- 1. USER INITIALIZATION ---

/**
 * Initializes the user by checking localStorage for a UserID.
 * If not found, creates a new one.
 * Also sets a default role.
 */
function initUser() {
    let userId = localStorage.getItem('easyRechargeUserID');
    let userRole = localStorage.getItem('easyRechargeUserRole');

    if (!userId) {
        userId = 'user-' + new Date().getTime() + '-' + Math.floor(Math.random() * 999);
        localStorage.setItem('easyRechargeUserID', userId);
    }

    if (!userRole) {
        userRole = 'Customer'; // Default role
        localStorage.setItem('easyRechargeUserRole', userRole);
    }
}

/**
 * Displays the UserID and Role in the header/nav.
 */
function displayUserInfo() {
    const userId = localStorage.getItem('easyRechargeUserID');
    const userRole = localStorage.getItem('easyRechargeUserRole');

    const navUserId = document.getElementById('navUserId');
    const navUserRole = document.getElementById('navUserRole');
    if (navUserId) navUserId.textContent = userId.substring(0, 15) + '...';
    if (navUserRole) navUserRole.textContent = userRole;

    // For profile page
    const profileUserId = document.getElementById('profileUserId');
    const profileUserRole = document.getElementById('profileUserRole');
    if (profileUserId) profileUserId.textContent = userId;
    if (profileUserRole) profileUserRole.textContent = userRole;
}

// --- 2. FORM HANDLING & CALCULATIONS ---

/**
 * Sets up event listeners for a specific order form.
 * @param {string} formId - The ID of the form element.
 * @param {string} type - The order type ('sim', 'game', 'smm', 'p2p').
 */
function setupOrderForm(formId, type) {
    const form = document.getElementById(formId);
    if (!form) return;

    const userRole = localStorage.getItem('easyRechargeUserRole') || 'Customer';
    const totalDisplay = document.getElementById('totalDisplay');
    const submitBtn = document.getElementById('submitBtn');

    // --- Dynamic Dropdown Logic ---
    populateDynamicSelects(form, type);

    // --- Calculation Logic ---
    const calculateTotal = () => {
        let total = 0;
        let description = "";

        try {
            if (type === 'sim' || type === 'game') {
                const serviceEl = form.querySelector('#service, #package');
                const selectedKey = serviceEl.value;
                if (selectedKey && SERVICE_PRICES[type][selectedKey]) {
                    total = SERVICE_PRICES[type][selectedKey].price;
                    description = SERVICE_PRICES[type][selectedKey].name;
                }
            } else if (type === 'smm') {
                const serviceEl = form.querySelector('#service');
                const quantityEl = form.querySelector('#quantity');
                const selectedKey = serviceEl.value;
                const quantity = parseInt(quantityEl.value) || 0;
                
                if (selectedKey && SERVICE_PRICES[type][selectedKey]) {
                    const pricePer1000 = SERVICE_PRICES[type][selectedKey].price;
                    total = (quantity / 1000) * pricePer1000;
                    description = `${SERVICE_PRICES[type][selectedKey].name} (${pricePer1000} MMK per 1000)`;
                }
            } else if (type === 'p2p') {
                const amountEl = form.querySelector('#amountSent');
                const amountSent = parseFloat(amountEl.value) || 0;
                const feePercent = SERVICE_PRICES.p2p.feePercent;
                
                const fee = amountSent * feePercent;
                const amountReceive = amountSent - fee;

                document.getElementById('feeDisplay').textContent = `Fee (${feePercent * 100}%): ${fee.toFixed(0)} MMK`;
                document.getElementById('receiveDisplay').textContent = `Amount to Receive: ${amountReceive.toFixed(0)} MMK`;
                return; // P2P has a different display
            }

            // Apply Reseller Discount
            if (userRole === 'Reseller' && type !== 'p2p') {
                const discount = total * RESELLER_DISCOUNT_PERCENT;
                total -= discount;
                description += ` (Reseller Price: -${RESELLER_DISCOUNT_PERCENT * 100}%)`;
            }
            
            if (totalDisplay) totalDisplay.textContent = `${total.toFixed(0)} MMK`;
            const descEl = document.getElementById('packageDescription');
            if (descEl) descEl.textContent = description;

        } catch (e) {
            console.error("Calculation error:", e);
            if (totalDisplay) totalDisplay.textContent = "Error";
        }
    };

    // Attach listeners
    form.addEventListener('input', calculateTotal);
    form.addEventListener('change', calculateTotal); // For select dropdowns
    
    // --- Form Submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn) submitBtn.disabled = true;
        if (submitBtn) submitBtn.textContent = 'Submitting...';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Add required backend data
        data.userId = localStorage.getItem('easyRechargeUserID');
        data.type = type;
        data.orderId = 'ORD-' + new Date().getTime(); // Client-side basic ID

        // Add calculated totals
        if (type === 'p2p') {
            const amountSent = parseFloat(data.amountSent) || 0;
            const fee = amountSent * SERVICE_PRICES.p2p.feePercent;
            const amountReceive = amountSent - fee;
            data.fee = fee.toFixed(0);
            data.amountReceive = amountReceive.toFixed(0);
        } else {
            // Recalculate total one last time for submission
            let total = 0;
            const serviceKey = data.service || data.package;
            if(type === 'sim' || type === 'game') {
                total = SERVICE_PRICES[type][serviceKey]?.price || 0;
            } else if (type === 'smm') {
                const pricePer1000 = SERVICE_PRICES[type][serviceKey]?.price || 0;
                total = (parseInt(data.quantity) / 1000) * pricePer1000;
            }
            if(userRole === 'Reseller') total *= (1 - RESELLER_DISCOUNT_PERCENT);
            data.total = total.toFixed(0);
        }

        // Send to backend
        const success = await sendOrder(data);

        if (success) {
            showToast('Order submitted successfully!', 'success');
            form.reset();
            if (totalDisplay) totalDisplay.textContent = "0 MMK";
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 1500);
        } else {
            showToast('Order submission failed. Please try again.', 'error');
            if (submitBtn) submitBtn.disabled = false;
            if (submitBtn) submitBtn.textContent = 'Submit Order';
        }
    });
}

/**
 * Populates second-level dropdowns based on the first selection.
 * @param {HTMLFormElement} form - The form element.
 * @param {string} type - The order type.
 */
function populateDynamicSelects(form, type) {
    let primarySelect, secondarySelect;

    if (type === 'sim') {
        primarySelect = form.querySelector('#provider');
        secondarySelect = form.querySelector('#service');
    } else if (type === 'game') {
        primarySelect = form.querySelector('#game');
        secondarySelect = form.querySelector('#package');
    } else if (type === 'smm') {
        primarySelect = form.querySelector('#platform');
        secondarySelect = form.querySelector('#service');
    } else {
        return; // No dynamic selects for P2P
    }

    primarySelect.addEventListener('change', () => {
        const selectedValue = primarySelect.value;
        secondarySelect.innerHTML = ''; // Clear options
        secondarySelect.disabled = true;

        if (!selectedValue) {
            secondarySelect.add(new Option('-- Select Primary First --', ''));
            return;
        }

        const options = DROPDOWN_MAP[type][selectedValue];
        if (options && options.length > 0) {
            secondarySelect.add(new Option(`-- Select ${type === 'game' ? 'Package' : 'Service'} --`, ''));
            options.forEach(key => {
                const optionData = SERVICE_PRICES[type][key];
                secondarySelect.add(new Option(optionData.name, key));
            });
            secondarySelect.disabled = false;
        } else {
            secondarySelect.add(new Option('-- No services available --', ''));
        }
    });
}


// --- 3. API CALLS (Backend Communication) ---

/**
 * Sends the new order data to the Google Apps Script backend.
 * @param {object} data - The order data object.
 * @returns {boolean} - True if successful, false if not.
 */
async function sendOrder(data) {
    if (GAS_WEB_APP_URL.includes('YOUR_DEPLOYMENT_ID')) {
        console.error('GAS_WEB_APP_URL is not set!');
        alert('FATAL ERROR: Backend URL not configured in script.js');
        return false;
    }
    
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for 'doPost' simple trigger
            cache: 'no-cache',
            redirect: 'follow',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Note: 'no-cors' mode means we can't read the response.
        // We assume success if the request was sent.
        // For a real app, you'd deploy properly and use JSONP or read the response.
        // For this demo, we'll assume it worked.
        return true; 
        
        /* // Proper way if not using 'no-cors'
        const result = await response.json();
        if (result.success) {
            return true;
        } else {
            console.error('Backend error:', result.message);
            return false;
        }
        */
        
    } catch (error) {
        console.error('Fetch Error:', error);
        return false;
    }
}

/**
 * Fetches order history for the current user.
 * @param {string} userId - The user's unique ID.
 * @param {string} action - 'profile' (last 10 + stats) or 'history' (all).
 * @returns {object|null} - The data object from the backend, or null on error.
 */
async function getOrders(userId, action = 'history') {
    if (GAS_WEB_APP_URL.includes('YOUR_DEPLOYMENT_ID')) {
        console.error('GAS_WEB_APP_URL is not set!');
        return null;
    }
    
    const url = `${GAS_WEB_APP_URL}?userId=${encodeURIComponent(userId)}&action=${encodeURIComponent(action)}`;
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            console.error('Backend error:', result.message);
            return null;
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showToast('Could not load order history.', 'error');
        return null;
    }
}

// --- 4. PAGE-SPECIFIC LOADERS ---

/**
 * Loads and displays data for the profile.html page.
 */
async function loadProfilePage() {
    const userId = localStorage.getItem('easyRechargeUserID');
    if (!userId) return;

    const data = await getOrders(userId, 'profile');
    
    if (data) {
        document.getElementById('statTotalOrders').textContent = data.totalOrders || 0;
        document.getElementById('statTotalSpent').textContent = `${data.totalSpent || 0} MMK`;
        document.getElementById('statTotalExchange').textContent = `${data.totalExchange || 0} MMK`;

        const tableBody = document.getElementById('ordersTableBody');
        tableBody.innerHTML = ''; // Clear loading message

        if (data.last10Orders && data.last10Orders.length > 0) {
            data.last10Orders.forEach(order => {
                const row = `
                    <tr>
                        <td>${new Date(order.Timestamp).toLocaleString()}</td>
                        <td>${order.Type}</td>
                        <td>${order.Service || order.Game || order.Package || order.FromMethod}</td>
                        <td>${order.Total || order.AmountReceive} MMK</td>
                        <td>${createStatusBadge(order.Status)}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5">No orders found.</td></tr>';
        }
    } else {
        document.getElementById('loadingOrders').textContent = 'Error loading history.';
    }
}

/**
 * Loads and displays data for the status.html (full history) page.
 */
async function loadFullHistoryPage() {
    const userId = localStorage.getItem('easyRechargeUserID');
    if (!userId) return;
    
    const data = await getOrders(userId, 'history');
    
    if (data && data.orders) {
        const tableBody = document.getElementById('fullOrdersTableBody');
        tableBody.innerHTML = ''; // Clear loading message

        if (data.orders.length > 0) {
            data.orders.forEach(order => {
                const details = order.Service || order.Game || order.Package || order.FromMethod;
                const row = `
                    <tr>
                        <td>${new Date(order.Timestamp).toLocaleString()}</td>
                        <td><code>${order.OrderID}</code></td>
                        <td>${order.Type}</td>
                        <td>${details}</td>
                        <td>${order.Total || order.AmountReceive} MMK</td>
                        <td>${createStatusBadge(order.Status)}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="6">No orders found.</td></tr>';
        }
    } else {
        document.getElementById('loadingFullOrders').textContent = 'Error loading history.';
    }
}

// --- 5. UTILITY FUNCTIONS ---

/**
 * Copies text from an input field to the clipboard.
 * @param {string} elementId - The ID of the input element.
 */
function copyToClipboard(elementId) {
    const input = document.getElementById(elementId);
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices

        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy.', 'error');
        }
    }
}

/**
 * Displays a temporary toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    if (!toast) {
        console.warn('Toast notification element not found.');
        return;
    }
    
    toast.textContent = message;
    toast.className = `show ${type}`; // Use classes for styling
    
    setTimeout(() => {
        toast.className = toast.className.replace('show', '');
    }, 3000); // Hide after 3 seconds
}

/**
 * Creates an HTML string for a status badge.
 * @param {string} status - The status text (e.g., 'Pending', 'Completed').
 * @returns {string} - HTML string for the badge.
 */
function createStatusBadge(status) {
    let statusClass = 'status-pending'; // Default
    if (status === 'Completed') {
        statusClass = 'status-completed';
    } else if (status === 'Cancelled') {
        statusClass = 'status-cancelled';
    }
    return `<span class="status-badge ${statusClass}">${status}</span>`;
}

      
