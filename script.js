// script.js
const GAS_URL = "YOUR_GAS_DEPLOY_URL"; // Replace with your GAS web app URL

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeToggle(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggle(newTheme);
}

function updateThemeToggle(theme) {
    const toggle = document.getElementById('modeToggle');
    if (toggle) {
        toggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// User Management
function initUser() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem('userId', userId);
    }
    
    const device = detectDevice();
    localStorage.setItem('userDevice', device);
    
    // Update user info in forms
    document.querySelectorAll('#userId').forEach(el => {
        if (el) el.value = userId;
    });
    
    document.querySelectorAll('#userDevice').forEach(el => {
        if (el) el.value = device;
    });
    
    // Update display elements
    const userIdDisplay = document.getElementById('userId');
    const userDeviceDisplay = document.getElementById('userDevice');
    
    if (userIdDisplay && userIdDisplay.tagName === 'SPAN') {
        userIdDisplay.textContent = userId;
    }
    if (userDeviceDisplay) {
        userDeviceDisplay.textContent = device;
    }
}

function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function detectDevice() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/.test(ua)) {
        return 'Mobile';
    } else if (/Tablet|iPad/.test(ua)) {
        return 'Tablet';
    } else {
        return 'Desktop';
    }
}

// Form Calculations
function initFormCalculations() {
    // SIM/Data form
    const simForm = document.getElementById('simOrderForm');
    if (simForm) {
        const quantity = simForm.querySelector('#quantity');
        const price = simForm.querySelector('#price');
        const total = simForm.querySelector('#totalAmount');
        
        const calculateTotal = () => {
            if (quantity && price && total) {
                const qty = parseInt(quantity.value) || 0;
                const prc = parseInt(price.value) || 0;
                total.value = (qty * prc).toLocaleString() + ' MMK';
            }
        };
        
        quantity?.addEventListener('input', calculateTotal);
        price?.addEventListener('input', calculateTotal);
    }
    
    // Game form
    const gameForm = document.getElementById('gameOrderForm');
    if (gameForm) {
        const quantity = gameForm.querySelector('#quantity');
        const price = gameForm.querySelector('#price');
        const total = gameForm.querySelector('#totalAmount');
        
        const calculateTotal = () => {
            if (quantity && price && total) {
                const qty = parseInt(quantity.value) || 0;
                const prc = parseInt(price.value) || 0;
                total.value = (qty * prc).toLocaleString() + ' MMK';
            }
        };
        
        quantity?.addEventListener('input', calculateTotal);
        price?.addEventListener('input', calculateTotal);
    }
    
    // SMM form
    const smmForm = document.getElementById('smmOrderForm');
    if (smmForm) {
        const quantity = smmForm.querySelector('#quantity');
        const price = smmForm.querySelector('#price');
        const total = smmForm.querySelector('#totalAmount');
        
        const calculateTotal = () => {
            if (quantity && price && total) {
                const qty = parseInt(quantity.value) || 0;
                const prc = parseInt(price.value) || 0;
                total.value = (qty * prc).toLocaleString() + ' MMK';
            }
        };
        
        quantity?.addEventListener('input', calculateTotal);
        price?.addEventListener('input', calculateTotal);
    }
    
    // P2P form calculations
    const p2pForm = document.getElementById('p2pForm');
    if (p2pForm) {
        const amount = p2pForm.querySelector('#amount');
        const fee = p2pForm.querySelector('#fee');
        const receive = p2pForm.querySelector('#receive');
        
        const calculateP2P = () => {
            if (amount && fee && receive) {
                const amt = parseInt(amount.value) || 0;
                const feeAmount = Math.max(100, Math.floor(amt * 0.01)); // 1% fee, min 100 MMK
                const receiveAmount = amt - feeAmount;
                
                fee.value = feeAmount.toLocaleString() + ' MMK';
                receive.value = receiveAmount.toLocaleString() + ' MMK';
            }
        };
        
        amount?.addEventListener('input', calculateP2P);
    }
}

// Copy to Clipboard
function copyText(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.select();
    element.setSelectionRange(0, 99999);
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Copied to clipboard!');
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Form Submission
function initFormSubmissions() {
    // SIM Order Form
    const simForm = document.getElementById('simOrderForm');
    if (simForm) {
        simForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrderForm('simOrderForm', 'order');
        });
    }
    
    // Game Order Form
    const gameForm = document.getElementById('gameOrderForm');
    if (gameForm) {
        gameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrderForm('gameOrderForm', 'order');
        });
    }
    
    // SMM Order Form
    const smmForm = document.getElementById('smmOrderForm');
    if (smmForm) {
        smmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitOrderForm('smmOrderForm', 'order_smm');
        });
    }
    
    // P2P Form
    const p2pForm = document.getElementById('p2pForm');
    if (p2pForm) {
        p2pForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitP2PForm();
        });
    }
}

async function submitOrderForm(formId, action) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = new FormData(form);
    const orderData = {
        action: action,
        order: {
            orderId: generateOrderId(),
            userId: localStorage.getItem('userId'),
            device: localStorage.getItem('userDevice'),
            timestamp: new Date().toISOString(),
            category: readCategoryFromURL() || 'general'
        }
    };
    
    // Collect form fields
    for (let [key, value] of formData.entries()) {
        if (key !== 'paymentMethod') {
            orderData.order[key] = value;
        }
    }
    
    // Get payment method
    const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked');
    if (paymentMethod) {
        orderData.order.paymentMethod = paymentMethod.value;
    }
    
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Order submitted successfully!');
            localStorage.setItem('last_order_id', result.orderId);
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 1500);
        } else {
            showToast('Failed to submit order. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showToast('Network error. Please check your connection.', 'error');
    }
}

async function submitP2PForm() {
    const form = document.getElementById('p2pForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const p2pData = {
        action: 'p2p',
        data: {
            orderId: generateOrderId(),
            userId: localStorage.getItem('userId'),
            timestamp: new Date().toISOString(),
            fromPayment: formData.get('fromPayment'),
            toPayment: formData.get('toPayment'),
            amount: formData.get('amount'),
            transactionId: formData.get('transactionId')
        }
    };
    
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(p2pData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('P2P exchange submitted successfully!');
            localStorage.setItem('last_order_id', result.orderId);
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 1500);
        } else {
            showToast('Failed to submit exchange. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting P2P:', error);
        showToast('Network error. Please check your connection.', 'error');
    }
}

function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD_${timestamp}_${random}`.toUpperCase();
}

function readCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category');
}

// Tab Management
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
            
            // Load data for active tab
            if (tabId === 'orders') {
                loadUserOrders();
            }
        });
    });
}

// Accordion
function initAccordion() {
    const accordionBtns = document.querySelectorAll('.accordion-btn');
    
    accordionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const content = btn.nextElementSibling;
            const isActive = content.classList.contains('active');
            
            // Close all accordions
            document.querySelectorAll('.accordion-content').forEach(c => {
                c.classList.remove('active');
                c.previousElementSibling.classList.remove('active');
            });
            
            // Open current if it was closed
            if (!isActive) {
                content.classList.add('active');
                btn.classList.add('active');
            }
        });
    });
}

// Dashboard Data
async function loadDashboardData() {
    try {
        // This would typically fetch from GAS
        // For now, we'll simulate with random data
        setTimeout(() => {
            document.getElementById('totalOrders').textContent = Math.floor(Math.random() * 50);
            document.getElementById('totalExchange').textContent = (Math.random() * 1000000).toLocaleString() + ' MMK';
            document.getElementById('activeUsers').textContent = Math.floor(Math.random() * 1000);
            document.getElementById('allOrders').textContent = Math.floor(Math.random() * 5000);
            document.getElementById('allExchange').textContent = (Math.random() * 50000000).toLocaleString() + ' MMK';
        }, 1000);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Order Status
async function loadUserOrders() {
    const tbody = document.querySelector('#ordersTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">Loading orders...</td></tr>';
    
    try {
        // Simulate API call
        setTimeout(() => {
            // This would be replaced with actual GAS API call
            const orders = [
                {
                    orderId: generateOrderId(),
                    category: 'SIM',
                    service: 'MPT Package',
                    quantity: 1,
                    total: '5000 MMK',
                    payment: 'KBZ Pay',
                    status: 'Processing'
                }
            ];
            
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="no-data">No orders found</td></tr>';
                return;
            }
            
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.orderId}</td>
                    <td>${order.category}</td>
                    <td>${order.service}</td>
                    <td>${order.quantity}</td>
                    <td>${order.total}</td>
                    <td>${order.payment}</td>
                    <td><span class="badge badge-${order.status.toLowerCase()}">${order.status}</span></td>
                </tr>
            `).join('');
        }, 1000);
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading orders</td></tr>';
    }
}

function refreshOrders() {
    showToast('Refreshing orders...');
    loadUserOrders();
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initUser();
    initFormCalculations();
    initFormSubmissions();
    initTabs();
    initAccordion();
    
    // Load appropriate data based on page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadDashboardData();
    }
    
    if (window.location.pathname.includes('status.html')) {
        loadUserOrders();
    }
    
    // Add theme toggle event listener
    const themeToggle = document.getElementById('modeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// Utility function for date formatting
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
        }
