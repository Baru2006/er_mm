/*
 * File: script.js
 * EasyRecharge MM Global JavaScript
 * Handles Theme, Navigation, Copy, Utility Functions, and Form Submission
 */

[span_13](start_span)// --- 1. CONFIGURATION PLACEHOLDERS[span_13](end_span) ---
const GAS_URL = "YOUR_GAS_DEPLOY_URL";
// Replace with your actual Firebase config if you use it (optional)
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
};

// Global variables (set on init)
window.USER_ID = null;
window.DEVICE = null;
window.LAST_ORDER_ID = localStorage.getItem('last_order_id') || 'N/A';

// --- 2. CORE UI FUNCTIONS ---

/**
 * 2.1. [span_14](start_span)Theme Toggle and Persistence[span_14](end_span)
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.body.setAttribute('data-theme', savedTheme);
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        modeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            modeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }
}

/**
 * 2.2. [span_15](start_span)Mobile Navigation Toggle[span_15](end_span)
 */
function initNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        // Close nav on link click (mobile-first UX)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }
}

/**
 * 2.3. [span_16](start_span)Toast Notification[span_16](end_span)
 * @param {string} msg - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showToast(msg, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.classList.add('toast-container');
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = msg;
    container.appendChild(toast);

    // Show and auto-remove
    setTimeout(() => {
        toast.classList.add('show');
    }, 10); // Small delay for smooth animation

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
            if (container.children.length === 0) {
                // Remove container if empty
                // document.body.removeChild(container);
            }
        }, 300);
    }, 3000);
}

/**
 * 2.4. [span_17](start_span)Copy Text to Clipboard[span_17](end_span)
 * @param {string} elementId - ID of the element (input or text content) to copy.
 */
function copyText(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        return showToast("Element not found!", 'error');
    }
    
    let textToCopy;
    if (element.value !== undefined) {
        textToCopy = element.value; // For input fields
    } else {
        textToCopy = element.textContent; // For text elements
    }

    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            showToast(`Copied: ${textToCopy.substring(0, 20)}...`, 'success');
        })
        .catch(err => {
            console.error('Copy failed: ', err);
            showToast('Failed to copy text!', 'error');
        });
}

// --- 3. UTILITY FUNCTIONS ---

/**
 * 3.1. [span_18](start_span)Detect Device Type[span_18](end_span)
 */
function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) return "Android";
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "iOS";
    return "Web";
}

/**
 * 3.2. [span_19](start_span)Initialize or Retrieve User ID[span_19](end_span)
 */
function initUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        // Generate 'U' + timestamp + 4 random digits
        const timestamp = new Date().getTime().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        userId = 'U-' + timestamp + random;
        localStorage.setItem('user_id', userId);
    }
    window.USER_ID = userId;

    // Set the readonly user_id field on pages that have it
    const userIdDisplay = document.getElementById('userIdDisplay');
    if (userIdDisplay) {
        userIdDisplay.value = userId;
    }
}

/**
 * 3.3. [span_20](start_span)Generate unique Order ID[span_20](end_span)
 * @param {string} prefix - The prefix, e.g., 'ORD' or 'SMM'
 */
function generateOrderId(prefix) {
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000); // 4 random digits
    return `${prefix}-${yyyy}${mm}${dd}-${random}`;
}

/**
 * 3.4. [span_21](start_span)Format Timestamp to readable date[span_21](end_span)
 */
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

[span_22](start_span)[span_23](start_span)// --- 4. FORM SUBMISSION TEMPLATE[span_22](end_span)[span_23](end_span) ---

/**
 * Submits form data to the GAS endpoint.
 * @param {string} formId - ID of the form element.
 * @param {string} action - The action string for the GAS backend ('order', 'order_smm', 'p2p').
 */
async function submitOrderForm(formId, action) {
    const form = document.getElementById(formId);
    if (!form || !form.checkValidity()) {
        form.reportValidity();
        return showToast("Please fill in all required fields.", 'error');
    }
    
    // Prevent double submission and show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    try {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => data[key] = value);
        
        // Add global required data
        const orderId = generateOrderId(action.toUpperCase().substring(0, 3));
        const payload = {
            action: action,
            order: {
                ...data,
                orderId: orderId,
                userId: window.USER_ID,
                device: window.DEVICE,
                timestamp: new Date().toISOString()
            }
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('last_order_id', orderId);
            window.LAST_ORDER_ID = orderId;
            showToast(`✅ ${action.toUpperCase()} submitted! Order ID: ${result.orderId}`, 'success');
            form.reset();
        } else {
            showToast(`❌ Submission Error: ${result.error || 'Check GAS logs.'}`, 'error');
        }

    } catch (error) {
        console.error('GAS Submission Error:', error);
        showToast('🚨 Network Error! Could not reach the server.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Order';
        }
    }
}

/**
 * 4.1. [span_24](start_span)SMM Specific check for Transaction ID[span_24](end_span)
 * @param {string} formId - ID of the form element.
 */
function requireTransactionId(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const txnIdInput = form.querySelector('input[name="transactionId"]');
    if (!txnIdInput || !txnIdInput.value.trim()) {
        showToast("Transaction ID is required for SMM orders!", 'error');
        txnIdInput.focus();
        return false;
    }
    return true;
}

[span_25](start_span)// --- 5. FIREBASE INTEGRATION (Optional/Fallback)[span_25](end_span) ---

/**
 * Initializes Firebase listeners for real-time status updates.
 */
function initFirebaseAndListeners() {
    if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
        console.warn("Firebase configuration is missing. Using GAS polling/fallback.");
        return;
    }

    // Dynamic import (assuming firebase-app and firebase-database are included in HTML)
    if (typeof firebase !== 'undefined' && firebase.database) {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(FIREBASE_CONFIG);
            }
            const db = firebase.database();
            const ordersRef = db.ref('orders');
            console.log("Firebase initialized. Attaching listeners to 'orders' path.");

            // Listen for new orders and changes to existing orders
            ordersRef.on('child_added', (snapshot) => {
                const order = snapshot.val();
                order.key = snapshot.key; // Add the order ID
                updateUI('added', order);
            });

            ordersRef.on('child_changed', (snapshot) => {
                const order = snapshot.val();
                order.key = snapshot.key;
                updateUI('changed', order);
            });

        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            showToast('🚨 Firebase failed to initialize. Using GAS polling.', 'error');
        }
    } else {
        console.warn("Firebase CDN not loaded. Using GAS polling/fallback.");
    }
}

/**
 * Placeholder for the function that will update the status.html UI.
 * This needs to be implemented in status.html's script section or global scope.
 * @param {string} type - 'added' or 'changed'
 * @param {object} order - The order data from Firebase
 */
function updateUI(type, order) {
    // Implement on status.html to manage tables/cards
    // Example: window.handleRealtimeUpdate(type, order);
    console.log(`Realtime update (${type}):`, order);
}


// --- 6. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNav();
    window.DEVICE = detectDevice();
    initUserId();
    
    // Check if Firebase is available and initialize listeners
    initFirebaseAndListeners();

    // Attach copy function to all buttons with data-copy-id
    document.querySelectorAll('[data-copy-id]').forEach(btn => {
        btn.addEventListener('click', () => {
            copyText(btn.getAttribute('data-copy-id'));
        });
    });

    // Display last order ID on Dashboard
    const lastOrderIdEl = document.getElementById('lastOrderIdDisplay');
    if (lastOrderIdEl) {
        lastOrderIdEl.textContent = window.LAST_ORDER_ID;
    }
});
               
