// script.js
/**
 * Easy Recharge MM - Frontend JavaScript Logic
 * Includes: Theme Toggle, User ID generation, Form Validation, API Communication
 */

// ⚠️ STEP 2: UPDATE THIS URL AFTER DEPLOYING YOUR GOOGLE APPS SCRIPT
const GAS_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"; 

const MOCK_PRICES = {
    'mpt-3gb': 1500, 'mpt-5gb': 2500, 'ooredoo-basic': 2000,
    'freefire-100': 3000, 'pubg-60uc': 2000, 'pubg-325uc': 8000, 'mlbb-86d': 2500,
    'fb-likes-1k': 2000, 'ig-followers-1k': 4000, 'yt-views-1k': 2000,
};
const P2P_FEE_RATE = 0.02; // 2%

/* --- 1. Utility Functions --- */

/**
 * Generates a unique User ID and stores it in localStorage.
 * @returns {string} The generated or retrieved User ID.
 */
function getUserId() {
    let userId = localStorage.getItem('easyRechargeUserId');
    if (!userId) {
        const randomNum = Math.floor(Math.random() * 900000) + 100000;
        userId = `Guest-${randomNum}`;
        localStorage.setItem('easyRechargeUserId', userId);
    }
    return userId;
}

/**
 * Initializes User ID display and avatar.
 */
function initUser() {
    const userId = getUserId();
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) {
        userIdDisplay.textContent = userId;
        userIdDisplay.dataset.raw = userId;
    }
    
    // Simple mock avatar injection (Placeholder)
    const avatarContainer = document.getElementById('user-avatar-container');
    if (avatarContainer) {
        avatarContainer.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    }
}

/**
 * Displays a global toast notification.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'show'; // Reset classes
    
    // Apply type specific styles (optional, can be done with CSS variables)
    if (type === 'error') {
        toast.style.backgroundColor = 'var(--status-cancelled)';
    } else if (type === 'success') {
        toast.style.backgroundColor = 'var(--status-success)';
    } else {
        toast.style.backgroundColor = '#333';
    }

    setTimeout(() => {
        toast.className = '';
    }, 3000);
}


/* --- 2. Theme Toggling --- */

/**
 * Apply theme based on localStorage or system preference.
 */
function loadTheme() {
    const preferredTheme = localStorage.getItem('theme') || 
                           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.body.setAttribute('data-theme', preferredTheme);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
        toggle.checked = preferredTheme === 'dark';
    }
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    const isDark = document.getElementById('theme-toggle').checked;
    const newTheme = isDark ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

/* --- 3. Form Calculations and Validation --- */

/**
 * Initializes calculation logic for order forms (SIM, Game, SMM).
 * @param {string} category - 'sim', 'game', or 'smm'.
 */
function initOrderFormCalculations(category) {
    const form = document.getElementById(`order${category.toUpperCase()}Form`);
    if (!form) return;

    const serviceSelect = document.getElementById('service-select');
    const quantityInput = document.getElementById('quantity');
    const totalDisplay = document.getElementById('total-amount');
    const totalRaw = document.getElementById('total-amount-raw');
    const submitBtn = document.getElementById('submit-order-btn');

    const updateCalculations = () => {
        const selectedService = serviceSelect.value;
        const qty = parseInt(quantityInput.value) || 0;
        
        let unitPrice = MOCK_PRICES[selectedService] || 0;
        let totalAmount = unitPrice * qty;

        totalDisplay.value = `${totalAmount.toLocaleString()} MMK`;
        totalRaw.value = totalAmount;

        validateForm(); // Re-validate after calculation
    };

    const validateForm = () => {
        const isFormValid = form.checkValidity() && parseInt(totalRaw.value) > 0;
        submitBtn.disabled = !isFormValid;
    };

    serviceSelect.addEventListener('change', updateCalculations);
    quantityInput.addEventListener('input', updateCalculations);
    form.addEventListener('input', validateForm); // General validation on any input change
    
    // Initial validation and calculation
    updateCalculations();
    validateForm();
}


/**
 * Initializes calculation and validation for P2P Exchange form.
 */
function initP2pExchangeForm() {
    const form = document.getElementById('p2pExchangeForm');
    if (!form) return;

    const amountInput = document.getElementById('amount');
    const fromPayment = document.getElementById('from-payment');
    const toPayment = document.getElementById('to-payment');
    const feeDisplay = document.getElementById('fee');
    const receiveDisplay = document.getElementById('receive-amount');
    const receiveRaw = document.getElementById('receive-amount-raw');
    const submitBtn = document.getElementById('submit-exchange-btn');
    const validationError = document.getElementById('validation-error');

    const updateCalculations = () => {
        const amount = parseInt(amountInput.value) || 0;
        
        let fee = Math.ceil(amount * P2P_FEE_RATE); // Use Math.ceil to round up fee
        let receiveAmount = amount - fee;

        feeDisplay.value = `${fee.toLocaleString()} MMK`;
        receiveDisplay.value = `${receiveAmount.toLocaleString()} MMK`;
        receiveRaw.value = receiveAmount;

        validateForm();
    };

    const validateForm = () => {
        const isPaymentSame = fromPayment.value === toPayment.value && fromPayment.value !== "";
        if (isPaymentSame) {
            validationError.style.display = 'block';
        } else {
            validationError.style.display = 'none';
        }

        const isAmountValid = parseInt(amountInput.value) >= 1000;
        const isFormValid = form.checkValidity() && !isPaymentSame && isAmountValid;
        submitBtn.disabled = !isFormValid;
    };

    amountInput.addEventListener('input', updateCalculations);
    fromPayment.addEventListener('change', updateCalculations);
    toPayment.addEventListener('change', updateCalculations);
    form.addEventListener('input', validateForm); // General validation

    // Initial setup
    updateCalculations();
    validateForm();
    
    // Setup form submission for P2P
    setupOrderSubmission('p2pExchangeForm', 'addP2P', 'p2p');
}

/* --- 4. API Communication and Submission --- */

const loadingState = document.getElementById('loading-state');

/**
 * Displays or hides the global loading state.
 * @param {boolean} show - True to show, false to hide.
 */
function toggleLoading(show) {
    if (loadingState) {
        loadingState.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Handles communication with the Google Apps Script API.
 * @param {string} action - The action parameter for the GAS endpoint (e.g., 'addSIM').
 * @param {object} data - The payload to send to GAS.
 * @returns {Promise<object>} The JSON response from the GAS script.
 */
async function sendRequestToGAS(action, data) {
    if (GAS_URL.includes("YOUR_GOOGLE_APPS_SCRIPT_URL_HERE")) {
        showToast("Error: GAS_URL has not been set up yet.", 'error');
        return { success: false, message: "GAS_URL is not configured." };
    }
    
    const payload = { action, ...data };

    try {
        toggleLoading(true);
        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("API Error:", error);
        showToast(`Network Error: Cannot connect to server. (${error.message})`, 'error');
        return { success: false, message: `Network error: ${error.message}` };
    } finally {
        toggleLoading(false);
    }
}

/**
 * Sets up the form submission handler.
 * @param {string} formId - The ID of the HTML form.
 * @param {string} action - The GAS action to call (e.g., 'addSIM').
 * @param {string} category - The category for the submission ('sim', 'p2p', etc.).
 */
function setupOrderSubmission(formId, action, category) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            showToast('Form data is incomplete or invalid.', 'error');
            return;
        }

        const formData = new FormData(form);
        const data = {
            userId: getUserId(),
            category: category.toUpperCase(),
        };

        // Standardizing form data collection
        for (const [key, value] of formData.entries()) {
            // Use key mapping for clarity in backend (e.g., totalAmountRaw -> total)
            if (key === 'totalAmountRaw' || key === 'receiveAmountRaw') {
                data['total'] = parseInt(value);
            } else if (key === 'targetInfo' || key === 'receiverAccount') {
                data['target'] = value;
            } else {
                data[key] = value;
            }
        }
        
        // Remove unnecessary or duplicate keys before sending
        delete data.totalAmountRaw;
        delete data.receiveAmountRaw;
        delete data.targetInfo;

        const result = await sendRequestToGAS(action, data);

        if (result.success) {
            showToast(`မှာယူမှု အောင်မြင်ပါသည်! Order ID: ${result.orderId}`, 'success');
            form.reset();
            // Redirect to status page after successful submission
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 1500);
        } else {
            showToast(`မှာယူမှု မအောင်မြင်ပါ: ${result.message}`, 'error');
        }
    });
}


/* --- 5. Initializers --- */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme initialization
    loadTheme();
    document.getElementById('theme-toggle')?.addEventListener('change', toggleTheme);
    
    // 2. User ID initialization
    initUser();
    
    // 3. Setup form handlers for Order Forms
    // Note: Individual order_xxx.html files call initOrderFormCalculations and setupOrderSubmission for their forms.
    
    // Setup for P2P Form if on pay.html
    if (document.getElementById('p2pExchangeForm')) {
        initP2pExchangeForm();
    }
    
    // 4. Copy button logic (for User ID)
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.copyTarget;
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                navigator.clipboard.writeText(targetElement.dataset.raw || targetElement.textContent);
                showToast('User ID ကို ကူးယူပြီးပါပြီ!', 'info');
            }
        });
    });

    // 5. Status page data fetching (Simplified mock/initialization)
    if (window.location.pathname.includes('status.html')) {
        // In a real app, this would trigger GAS.fetchData('list', { userId: getUserId() })
        // For now, it's just a placeholder.
    }
});
            
