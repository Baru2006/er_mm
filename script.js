// Configuration - Replace with your actual values in production
const GAS_URL = "YOUR_GAS_DEPLOY_URL"; // Replace with your Google Apps Script deployment URL
// const firebaseConfig = {
//     apiKey: "YOUR_API_KEY",
//     authDomain: "YOUR_PROJECT.firebaseapp.com",
//     databaseURL: "https://YOUR_PROJECT.firebaseio.com",
//     projectId: "YOUR_PROJECT",
//     storageBucket: "YOUR_PROJECT.appspot.com",
//     messagingSenderId: "YOUR_SENDER_ID",
//     appId: "YOUR_APP_ID"
// };

// Theme Management
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeUser();
    initializeDevice();
    
    // Initialize form submissions if forms exist
    initializeForms();
});

function initializeTheme() {
    const toggle = document.getElementById('modeToggle');
    const body = document.body;
    const currentMode = localStorage.getItem('theme') || 'light';
    body.dataset.theme = currentMode;
    
    if (toggle) {
        toggle.addEventListener('click', () => {
            body.dataset.theme = body.dataset.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', body.dataset.theme);
            updateThemeIcon();
        });
        updateThemeIcon();
    }
}

function updateThemeIcon() {
    const toggle = document.getElementById('modeToggle');
    if (toggle) {
        toggle.textContent = document.body.dataset.theme === 'light' ? '🌙' : '☀️';
    }
}

// User Management
function initializeUser() {
    if (!localStorage.user_id) {
        localStorage.user_id = 'U' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    }
    
    // Set user ID in all userId fields
    const userIdElements = document.querySelectorAll('#userId');
    userIdElements.forEach(element => {
        if (element.tagName === 'INPUT') {
            element.value = localStorage.user_id;
        } else {
            element.textContent = localStorage.user_id;
        }
    });
}

// Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/android/i.test(userAgent)) {
        return "Android";
    }
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }
    return "Web";
}

function initializeDevice() {
    const device = detectDevice();
    
    // Set device in all device fields
    const deviceElements = document.querySelectorAll('#device');
    deviceElements.forEach(element => {
        if (element.tagName === 'INPUT') {
            element.value = device;
        } else {
            element.textContent = device;
        }
    });
}

// Copy Text Function
function copyText(elementId) {
    const element = document.getElementById(elementId);
    let textToCopy = '';
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        textToCopy = element.value;
    } else {
        textToCopy = element.textContent || element.innerText;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('✅ Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('❌ Failed to copy');
    });
}

// Toast Notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Form Submission
function submitOrderForm(formId, action) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = new FormData(form);
    const orderData = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        orderData[key] = value;
    }
    
    // Add metadata
    orderData.orderId = generateOrderId();
    orderData.user_id = localStorage.user_id;
    orderData.device = detectDevice();
    orderData.createdAt = new Date().toISOString();
    
    // Read category from URL if available
    const category = readCategoryFromURL();
    if (category) {
        orderData.category = category;
    }
    
    // Prepare payload
    const payload = {
        action: action,
        order: orderData
    };
    
    // Submit to GAS
    fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('✅ Order submitted successfully!');
            localStorage.setItem('last_order_id', data.orderId);
            
            // Redirect to status page after success
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 2000);
        } else {
            showToast('❌ Order submission failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('❌ Network error - please try again');
    });
}

function initializeForms() {
    // Initialize any form submissions that need special handling
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Forms are handled individually in their respective HTML files
    });
}

// Utility Functions
function generateOrderId(prefix = 'ORD') {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function formatDate(date) {
    return new Date(date).toLocaleString();
}

function readCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category');
}

// Firebase Integration (Optional)
function initFirebaseAndListeners(config) {
    if (!config || !config.apiKey) {
        console.log('Firebase config not provided - skipping Firebase initialization');
        return;
    }
    
    try {
        // Initialize Firebase
        firebase.initializeApp(config);
        const database = firebase.database();
        
        // Listen for order updates
        const ordersRef = database.ref('orders');
        
        ordersRef.on('child_added', (snapshot) => {
            updateOrderUI(snapshot.val());
        });
        
        ordersRef.on('child_changed', (snapshot) => {
            updateOrderUI(snapshot.val());
        });
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

function updateOrderUI(order) {
    // Update UI with realtime order data
    // This would be implemented based on specific page requirements
    console.log('Order updated:', order);
}

// Demo data initialization for dashboard
function initializeDashboardData() {
    // This would be replaced with real data from Firebase/GAS
    setTimeout(() => {
        const userIdElement = document.getElementById('userId');
        const userDeviceElement = document.getElementById('userDevice');
        
        if (userIdElement) userIdElement.textContent = localStorage.user_id || '—';
        if (userDeviceElement) userDeviceElement.textContent = detectDevice();
        
        // Demo stats - replace with real data
        document.getElementById('totalOrders').textContent = '5';
        document.getElementById('totalExchange').textContent = '25,000 MMK';
        document.getElementById('activeUsers').textContent = '1,234';
        document.getElementById('allOrders').textContent = '8,765';
        document.getElementById('allExchange').textContent = '12.5M MMK';
    }, 500);
}

// Initialize dashboard if on index page
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    document.addEventListener('DOMContentLoaded', initializeDashboardData);
}

// Initialize Firebase if config is provided (uncomment and add your config)
// initFirebaseAndListeners(firebaseConfig);
