// Global Configuration
const GAS_URL = "YOUR_GAS_DEPLOY_URL"; // Replace with your GAS web app URL
// const firebaseConfig = {
//     apiKey: "YOUR_API_KEY",
//     authDomain: "YOUR_PROJECT.firebaseapp.com",
//     databaseURL: "https://YOUR_PROJECT.firebaseio.com",
//     projectId: "YOUR_PROJECT_ID",
//     storageBucket: "YOUR_PROJECT.appspot.com",
//     messagingSenderId: "YOUR_SENDER_ID",
//     appId: "YOUR_APP_ID"
// };

// Theme Management
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeFooterYear();
    initializeUser();
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
        });
    }
}

function initializeFooterYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// User Management
function initializeUser() {
    const userIdElement = document.getElementById('userId');
    if (userIdElement && userIdElement.tagName === 'INPUT') {
        // For form inputs
        userIdElement.value = getOrCreateUserId();
    } else if (userIdElement) {
        // For display elements
        userIdElement.textContent = getOrCreateUserId();
    }
    
    const deviceElement = document.getElementById('userDevice');
    if (deviceElement) {
        deviceElement.textContent = detectDevice();
    }
    
    const deviceInput = document.getElementById('device');
    if (deviceInput) {
        deviceInput.value = detectDevice();
    }
}

function getOrCreateUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('user_id', userId);
    }
    return userId;
}

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

// Utility Functions
function generateOrderId(prefix = 'ORD') {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

function formatDate(date = new Date()) {
    return date.toISOString().replace('T', ' ').substr(0, 19);
}

function readCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category') || '';
}

// Copy to Clipboard
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

// Toast Notifications
function showToast(message, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Form Submission
function submitOrderForm(formId, action) {
    const form = document.getElementById(formId);
    if (!form) return false;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            showToast('❌ Please fill in all required fields');
            return;
        }

        const formData = new FormData(form);
        const orderData = {
            orderId: generateOrderId(),
            user_id: localStorage.getItem('user_id'),
            device: detectDevice(),
            createdAt: formatDate()
        };

        // Collect form data
        for (let [key, value] of formData.entries()) {
            if (key !== 'payment') { // Handle radio groups separately
                orderData[key] = value;
            }
        }

        // Handle payment method
        const paymentRadio = form.querySelector('input[name="payment"]:checked');
        if (paymentRadio) {
            orderData.payment = paymentRadio.value;
        }

        // Add category based on action
        if (action === 'order') {
            orderData.category = "SIM";
        } else if (action === 'order_game') {
            orderData.category = "Game";
        } else if (action === 'order_smm') {
            orderData.category = "SMM";
        }

        const payload = {
            action: action,
            order: orderData
        };

        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                showToast('✅ Order submitted successfully!');
                localStorage.setItem('last_order_id', orderData.orderId);
                
                // Redirect to status page after successful submission
                setTimeout(() => {
                    window.location.href = 'status.html';
                }, 1500);
            } else {
                throw new Error('Server responded with error');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            showToast('❌ Failed to submit order. Please try again.');
        }
    });

    return true;
}

// P2P Exchange Form Submission
function submitP2PForm() {
    const form = document.getElementById('p2pForm');
    if (!form) return false;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!form.checkValidity()) {
            showToast('❌ Please fill in all required fields');
            return;
        }

        const formData = new FormData(form);
        const exchangeData = {
            orderId: generateOrderId('P2P'),
            user_id: localStorage.getItem('user_id'),
            userPhone: formData.get('userPhone'),
            fromPayment: formData.get('fromPayment'),
            toPayment: formData.get('toPayment'),
            amount: parseInt(formData.get('amount')),
            fee: parseInt(document.getElementById('fee').value),
            receive: parseInt(document.getElementById('receive').value),
            transactionId: formData.get('transactionId'),
            createdAt: formatDate()
        };

        const payload = {
            action: "p2p",
            data: exchangeData
        };

        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                showToast('✅ Exchange request submitted!');
                localStorage.setItem('last_order_id', exchangeData.orderId);
                
                setTimeout(() => {
                    window.location.href = 'status.html';
                }, 1500);
            } else {
                throw new Error('Server responded with error');
            }
        } catch (error) {
            console.error('Error submitting exchange:', error);
            showToast('❌ Failed to submit exchange. Please try again.');
        }
    });

    return true;
}

// Initialize form submissions based on current page
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    if (path.includes('order_sim.html')) {
        submitOrderForm('simOrderForm', 'order');
    } else if (path.includes('order_game.html')) {
        submitOrderForm('gameOrderForm', 'order_game');
    } else if (path.includes('order_smm.html')) {
        submitOrderForm('smmOrderForm', 'order_smm');
    } else if (path.includes('pay.html')) {
        submitP2PForm();
    }
});

// Firebase Integration (Optional - for realtime updates)
function initFirebaseAndListeners(config) {
    if (!config || !config.apiKey) {
        console.log('Firebase config not provided');
        return;
    }

    // Initialize Firebase
    firebase.initializeApp(config);
    const database = firebase.database();
    
    // Listen for order status updates
    const userId = localStorage.getItem('user_id');
    if (userId) {
        const userOrdersRef = database.ref('orders').orderByChild('user_id').equalTo(userId);
        
        userOrdersRef.on('child_added', (snapshot) => {
            updateOrderStatus(snapshot.val());
        });
        
        userOrdersRef.on('child_changed', (snapshot) => {
            updateOrderStatus(snapshot.val());
        });
    }
}

function updateOrderStatus(order) {
    // Update UI with new order status
    console.log('Order status updated:', order);
    // Implementation depends on specific UI requirements
}

// Demo data for dashboard (replace with actual API calls)
function initializeDashboardData() {
    // These would be replaced with actual API calls to GAS/Firebase
    const demoData = {
        totalOrders: 15,
        totalExchange: '125,000 MMK',
        activeUsers: 243,
        allOrders: 1567,
        allExchange: '2,450,000 MMK'
    };

    // Update dashboard elements if they exist
    const elements = {
        'totalOrders': demoData.totalOrders,
        'totalExchange': demoData.totalExchange,
        'activeUsers': demoData.activeUsers,
        'allOrders': demoData.allOrders,
        'allExchange': demoData.allExchange
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// Initialize dashboard data if on dashboard page
if (window.location.pathname.includes('index.html') || 
    window.location.pathname === '/' || 
    window.location.pathname.endsWith('/')) {
    document.addEventListener('DOMContentLoaded', initializeDashboardData);
}

// Export functions for use in inline scripts
window.copyText = copyText;
window.showToast = showToast;
window.detectDevice = detectDevice;
window.initUser = initializeUser;
