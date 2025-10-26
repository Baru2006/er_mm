// script.js - Updated with fixed pricing and auto-calculation
const GAS_URL = "YOUR_GAS_DEPLOY_URL";

// Service pricing data
const SERVICE_PRICES = {
    // SIM/Data Services
    sim: {
        'mpt-3gb': { name: 'MPT 3GB/7Days', price: 1500 },
        'mpt-5gb': { name: 'MPT 5GB/15Days', price: 2500 },
        'mpt-10gb': { name: 'MPT 10GB/30Days', price: 4500 },
        'telenor-regular': { name: 'Telenor Regular', price: 1000 },
        'telenor-data': { name: 'Telenor Data Bundle', price: 1200 },
        'telenor-social': { name: 'Telenor Social Bundle', price: 800 },
        'ooredoo-basic': { name: 'Ooredoo Basic', price: 2000 },
        'ooredoo-premium': { name: 'Ooredoo Premium', price: 3500 },
        'ooredoo-unlimited': { name: 'Ooredoo Unlimited', price: 6000 }
    },
    
    // Game Services
    game: {
        'freefire-100': { name: 'Free Fire 100 Diamonds', price: 3000 },
        'freefire-500': { name: 'Free Fire 500 Diamonds', price: 12000 },
        'freefire-1000': { name: 'Free Fire 1000 Diamonds', price: 22000 },
        'pubg-60': { name: 'PUBG 60 UC', price: 2000 },
        'pubg-325': { name: 'PUBG 325 UC', price: 8000 },
        'pubg-660': { name: 'PUBG 660 UC', price: 15000 },
        'mlbb-86': { name: 'MLBB 86 Diamonds', price: 2500 },
        'mlbb-429': { name: 'MLBB 429 Diamonds', price: 10000 },
        'mlbb-875': { name: 'MLBB 875 Diamonds', price: 18000 }
    },
    
    // SMM Services
    smm: {
        'fb-likes': { name: 'Facebook Likes', price: 2000, unit: 1000 },
        'fb-followers': { name: 'Facebook Followers', price: 3500, unit: 1000 },
        'fb-comments': { name: 'Facebook Comments', price: 4000, unit: 1000 },
        'ig-followers': { name: 'Instagram Followers', price: 4000, unit: 1000 },
        'ig-likes': { name: 'Instagram Likes', price: 2500, unit: 1000 },
        'ig-views': { name: 'Instagram Views', price: 1500, unit: 1000 },
        'yt-subscribers': { name: 'YouTube Subscribers', price: 8000, unit: 1000 },
        'yt-likes': { name: 'YouTube Likes', price: 3000, unit: 1000 },
        'yt-views': { name: 'YouTube Views', price: 2000, unit: 1000 }
    }
};

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

    // Update profile picture with user initial
    const profilePic = document.querySelector('.profile-pic');
    if (profilePic) {
        const initial = userId.charAt(0).toUpperCase();
        profilePic.textContent = initial;
    }
}

function generateUserId() {
    return 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function detectDevice() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/.test(ua)) {
        return '📱 Mobile';
    } else if (/Tablet|iPad/.test(ua)) {
        return '📟 Tablet';
    } else {
        return '💻 Desktop';
    }
}

// Enhanced Form Calculations with Fixed Pricing
function initFormCalculations() {
    // SIM/Data form
    const simForm = document.getElementById('simOrderForm');
    if (simForm) {
        const serviceSelect = simForm.querySelector('#service');
        const quantity = simForm.querySelector('#quantity');
        const price = simForm.querySelector('#price');
        const total = simForm.querySelector('#totalAmount');
        
        serviceSelect.innerHTML = `
            <option value="">Select Service</option>
            <option value="mpt-3gb">MPT 3GB/7Days - 1,500 MMK</option>
            <option value="mpt-5gb">MPT 5GB/15Days - 2,500 MMK</option>
            <option value="mpt-10gb">MPT 10GB/30Days - 4,500 MMK</option>
            <option value="telenor-regular">Telenor Regular - 1,000 MMK</option>
            <option value="telenor-data">Telenor Data Bundle - 1,200 MMK</option>
            <option value="telenor-social">Telenor Social Bundle - 800 MMK</option>
            <option value="ooredoo-basic">Ooredoo Basic - 2,000 MMK</option>
            <option value="ooredoo-premium">Ooredoo Premium - 3,500 MMK</option>
            <option value="ooredoo-unlimited">Ooredoo Unlimited - 6,000 MMK</option>
        `;
        
        const calculateTotal = () => {
            if (serviceSelect && quantity && price && total) {
                const selectedService = SERVICE_PRICES.sim[serviceSelect.value];
                if (selectedService) {
                    price.value = selectedService.price;
                    const qty = parseInt(quantity.value) || 1;
                    total.value = (qty * selectedService.price).toLocaleString() + ' MMK';
                } else {
                    price.value = '';
                    total.value = '0 MMK';
                }
            }
        };
        
        serviceSelect?.addEventListener('change', calculateTotal);
        quantity?.addEventListener('input', calculateTotal);
    }
    
    // Game form
    const gameForm = document.getElementById('gameOrderForm');
    if (gameForm) {
        const gameSelect = gameForm.querySelector('#game');
        const quantity = gameForm.querySelector('#quantity');
        const price = gameForm.querySelector('#price');
        const total = gameForm.querySelector('#totalAmount');
        
        gameSelect.innerHTML = `
            <option value="">Select Game Package</option>
            <option value="freefire-100">Free Fire 100 Diamonds - 3,000 MMK</option>
            <option value="freefire-500">Free Fire 500 Diamonds - 12,000 MMK</option>
            <option value="freefire-1000">Free Fire 1000 Diamonds - 22,000 MMK</option>
            <option value="pubg-60">PUBG 60 UC - 2,000 MMK</option>
            <option value="pubg-325">PUBG 325 UC - 8,000 MMK</option>
            <option value="pubg-660">PUBG 660 UC - 15,000 MMK</option>
            <option value="mlbb-86">MLBB 86 Diamonds - 2,500 MMK</option>
            <option value="mlbb-429">MLBB 429 Diamonds - 10,000 MMK</option>
            <option value="mlbb-875">MLBB 875 Diamonds - 18,000 MMK</option>
        `;
        
        const calculateTotal = () => {
            if (gameSelect && quantity && price && total) {
                const selectedService = SERVICE_PRICES.game[gameSelect.value];
                if (selectedService) {
                    price.value = selectedService.price;
                    const qty = parseInt(quantity.value) || 1;
                    total.value = (qty * selectedService.price).toLocaleString() + ' MMK';
                } else {
                    price.value = '';
                    total.value = '0 MMK';
                }
            }
        };
        
        gameSelect?.addEventListener('change', calculateTotal);
        quantity?.addEventListener('input', calculateTotal);
    }
    
    // SMM form
    const smmForm = document.getElementById('smmOrderForm');
    if (smmForm) {
        const serviceSelect = smmForm.querySelector('#service');
        const quantity = smmForm.querySelector('#quantity');
        const price = smmForm.querySelector('#price');
        const total = smmForm.querySelector('#totalAmount');
        
        serviceSelect.innerHTML = `
            <option value="">Select SMM Service</option>
            <option value="fb-likes">Facebook Likes (per 1000) - 2,000 MMK</option>
            <option value="fb-followers">Facebook Followers (per 1000) - 3,500 MMK</option>
            <option value="fb-comments">Facebook Comments (per 1000) - 4,000 MMK</option>
            <option value="ig-followers">Instagram Followers (per 1000) - 4,000 MMK</option>
            <option value="ig-likes">Instagram Likes (per 1000) - 2,500 MMK</option>
            <option value="ig-views">Instagram Views (per 1000) - 1,500 MMK</option>
            <option value="yt-subscribers">YouTube Subscribers (per 1000) - 8,000 MMK</option>
            <option value="yt-likes">YouTube Likes (per 1000) - 3,000 MMK</option>
            <option value="yt-views">YouTube Views (per 1000) - 2,000 MMK</option>
        `;
        
        const calculateTotal = () => {
            if (serviceSelect && quantity && price && total) {
                const selectedService = SERVICE_PRICES.smm[serviceSelect.value];
                if (selectedService) {
                    price.value = selectedService.price;
                    const qty = parseInt(quantity.value) || 100;
                    const unit = selectedService.unit || 1;
                    total.value = (qty * selectedService.price / unit).toLocaleString() + ' MMK';
                } else {
                    price.value = '';
                    total.value = '0 MMK';
                }
            }
        };
        
        serviceSelect?.addEventListener('change', calculateTotal);
        quantity?.addEventListener('input', calculateTotal);
        
        // Set default quantity for SMM
        quantity.value = 1000;
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
            showToast('✅ Copied to clipboard!');
        }
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showToast('❌ Failed to copy', 'error');
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
    
    // Get service name from pricing data
    const serviceSelect = form.querySelector('select');
    if (serviceSelect && serviceSelect.value) {
        const category = readCategoryFromURL() || 'sim';
        const serviceData = SERVICE_PRICES[category][serviceSelect.value];
        if (serviceData) {
            orderData.order.serviceName = serviceData.name;
        }
    }
    
    try {
        showToast('🔄 Submitting order...', 'info');
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Order submitted successfully!');
            localStorage.setItem('last_order_id', result.orderId);
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 2000);
        } else {
            showToast('❌ Failed to submit order. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        showToast('❌ Network error. Please check your connection.', 'error');
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
        showToast('🔄 Processing exchange...', 'info');
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(p2pData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ P2P exchange submitted successfully!');
            localStorage.setItem('last_order_id', result.orderId);
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 2000);
        } else {
            showToast('❌ Failed to submit exchange. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error submitting P2P:', error);
        showToast('❌ Network error. Please check your connection.', 'error');
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
        // Simulate API call with better visual feedback
        const elements = {
            totalOrders: document.getElementById('totalOrders'),
            totalExchange: document.getElementById('totalExchange'),
            activeUsers: document.getElementById('activeUsers'),
            allOrders: document.getElementById('allOrders'),
            allExchange: document.getElementById('allExchange')
        };
        
        // Animate counting effect
        Object.values(elements).forEach(el => {
            if (el) {
                animateCount(el, Math.floor(Math.random() * 1000));
            }
        });
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function animateCount(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setI
