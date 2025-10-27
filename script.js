const GAS_URL = 'https://script.google.com/macros/s/AKfycbwo82rh2cRWnCS3kXktpEM0kwd2GyT7HO9ToZ8xfcmh/dev';
const SERVICE_PRICES = {
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
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
}

// User Management
function initUser() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem('userId', userId);
    }
    
    document.getElementById('userId').textContent = `User: ${userId}`;
    
    // Generate and display user avatar
    const avatarSvg = generateUserAvatar(userId);
    const avatarContainer = document.getElementById('userAvatar');
    if (avatarContainer) {
        avatarContainer.innerHTML = avatarSvg;
    }
    
    return userId;
}

function generateUserId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `user_${timestamp}_${random}`.toUpperCase();
}

function generateUserAvatar(userId) {
    const colors = ['#ff7b00', '#ff5500', '#e56a00', '#cc5f00'];
    const color = colors[userId.charCodeAt(0) % colors.length];
    const initial = userId.charAt(0).toUpperCase();
    
    return `
        <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="30" fill="${color}"/>
            <text x="30" y="38" text-anchor="middle" fill="white" font-family="Poppins" font-size="24" font-weight="600">${initial}</text>
        </svg>
    `;
}

// Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent;
    let device = 'Unknown Device';
    
    if (/Android/.test(userAgent)) {
        device = 'Android Device';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        device = 'iOS Device';
    } else if (/Windows/.test(userAgent)) {
        device = 'Windows PC';
    } else if (/Mac/.test(userAgent)) {
        device = 'Mac';
    } else if (/Linux/.test(userAgent)) {
        device = 'Linux';
    }
    
    const deviceElement = document.getElementById('userDevice');
    if (deviceElement) {
        deviceElement.textContent = device;
    }
    
    return device;
}

// Copy to Clipboard
function copyText(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.value || element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy');
    });
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    const icon = type === 'success' ? 
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' :
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
    
    toast.innerHTML = `${icon} ${message}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Form Submission
// script.js ထဲမှာ ဒီ function ကို ပြင်ပါ
async function submitOrderForm(formId, action) {
  const form = document.getElementById(formId);
  if (!form) return;
  
  const formData = new FormData(form);
  
  // FIX: Make sure we're sending the correct data structure
  const orderData = {
    action: action,
    order: {
      orderId: generateOrderId(),
      userId: localStorage.getItem('userId'),
      device: detectDevice(),
      timestamp: new Date().toISOString(),
      ...Object.fromEntries(formData)
    }
  };
  
  console.log("Submitting order data:", orderData);
  
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    console.log("Server response:", result);
    
    if (result.success) {
      localStorage.setItem('last_order_id', result.orderId);
      showToast('Order submitted successfully!');
      setTimeout(() => {
        window.location.href = 'status.html';
      }, 1500);
    } else {
      throw new Error(result.error || 'Submission failed');
    }
  } catch (error) {
    console.error('Submission error:', error);
    showToast('Failed to submit order: ' + error.message, 'error');
  }
}

function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 6);
    return `ORD_${timestamp}_${random}`.toUpperCase();
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function readCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('category');
}

// Auto-calculation for order forms
function initAutoCalculation(category) {
    const serviceSelect = document.getElementById('service');
    const quantityInput = document.getElementById('quantity');
    const priceInput = document.getElementById('price');
    const totalInput = document.getElementById('total');
    
    if (!serviceSelect || !quantityInput || !priceInput || !totalInput) return;
    
    function updateTotal() {
        const service = serviceSelect.value;
        const quantity = parseInt(quantityInput.value) || 1;
        
        if (service && SERVICE_PRICES[category] && SERVICE_PRICES[category][service]) {
            const price = SERVICE_PRICES[category][service].price;
            priceInput.value = price.toLocaleString() + ' MMK';
            
            const total = price * quantity;
            totalInput.value = total.toLocaleString() + ' MMK';
        } else {
            priceInput.value = '';
            totalInput.value = '';
        }
    }
    
    serviceSelect.addEventListener('change', updateTotal);
    quantityInput.addEventListener('input', updateTotal);
    
    // Initialize calculation
    updateTotal();
}

// Dashboard Statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${GAS_URL}?action=stats&userId=${localStorage.getItem('userId')}`);
        const stats = await response.json();
        
        // Update user stats
        if (stats.userStats) {
            document.getElementById('totalOrders').textContent = stats.userStats.totalOrders || '0';
            document.getElementById('totalExchange').textContent = stats.userStats.totalExchange ? `${stats.userStats.totalExchange} MMK` : '0 MMK';
        }
        
        // Update global stats
        if (stats.globalStats) {
            document.getElementById('activeUsers').textContent = stats.globalStats.activeUsers || '0';
            document.getElementById('globalOrders').textContent = stats.globalStats.totalOrders || '0';
            document.getElementById('globalExchange').textContent = stats.globalStats.totalExchange ? `${stats.globalStats.totalExchange} MMK` : '0 MMK';
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Order Status Management
async function loadOrderStatus() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const response = await fetch(`${GAS_URL}?action=list&userId=${userId}`);
        const orders = await response.json();
        
        displayOrders(orders);
    } catch (error) {
        console.error('Failed to load orders:', error);
        showToast('Failed to load orders', 'error');
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-center">No orders found</p>';
        return;
    }
    
    const ordersHtml = orders.map(order => `
        <div class="order-item">
            <div class="order-header">
                <h4>${order.OrderID}</h4>
                <span class="status-badge status-${order.Status?.toLowerCase() || 'pending'}">
                    ${getStatusIcon(order.Status)}
                    ${order.Status || 'Pending'}
                </span>
            </div>
            <div class="order-details">
                <p><strong>Service:</strong> ${order.Service}</p>
                <p><strong>Total:</strong> ${order.Total} MMK</p>
                <p><strong>Date:</strong> ${formatDate(order.Timestamp)}</p>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ordersHtml;
}

function getStatusIcon(status) {
    const icons = {
        'Pending': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        'Processing': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        'Success': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        'Cancelled': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
    };
    
    return icons[status] || icons['Pending'];
}

// Accordion functionality
function initAccordions() {
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const accordion = header.parentElement;
            accordion.classList.toggle('active');
        });
    });
}

// Tab functionality
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show active content
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core features
    initTheme();
    initUser();
    detectDevice();
    
    // Initialize page-specific features
    if (document.getElementById('themeToggle')) {
        document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    }
    
    // Dashboard specific
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        loadDashboardStats();
    }
    
    // Status page specific
    if (window.location.pathname.includes('status.html')) {
        initTabs();
        loadOrderStatus();
    }
    
    // FAQ page specific
    if (window.location.pathname.includes('faq.html')) {
        initAccordions();
    }
    
    // Order forms specific
    const category = readCategoryFromURL();
    if (category && ['sim', 'game', 'smm'].includes(category)) {
        initAutoCalculation(category);
    }
});

// Utility function for P2P fee calculation
function calculateP2PFee(amount) {
    const fee = Math.max(100, amount * 0.03); // 3% fee, minimum 100 MMK
    return {
        fee: fee,
        receive: amount - fee
    };
            }
