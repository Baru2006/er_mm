// === Configuration ===
const EXTERNAL_ASSETS = {
    logo: {
        light: 'https://example.com/logo/easyrecharge-light.svg',
        dark: 'https://i.postimg.cc/d3RHSVrF/ei-1761547356275-removebg-preview.png'
    },
    profile: {
        baseUrl: 'https://example.com/profiles/',
        default: 'https://example.com/profiles/default-avatar.svg'
    },
    icons: {
        dashboard: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1c.6 0 1-.4 1-1s-.4-1-1-1h-1V4c0-1.1-.9-2-2-2H6C4.9 2 4 2.9 4 4v7H3c-.6 0-1 .4-1 1s.4 1 1 1zm4-9h10v5H7V4zm0 16v-7h10v7H7z"/></svg>',
        orders: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3-2-2-2 2 4 4 5-5z"/></svg>',
        exchange: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/></svg>',
        status: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>',
        sim: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.99 4c0-1.1-.89-2-1.99-2h-8L4 8v12c0 1.1.9 2 2 2h12.01c1.1 0 1.99-.9 1.99-2l-.01-16zM9 19H7v-2h2v2zm8 0h-2v-2h2v2zm-8-4H7v-4h2v4zm4 4h-2v-4h2v4zm0-6h-2v-2h2v2zm4 2h-2v-4h2v4z"/></svg>',
        game: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8zM6 15h2v-2h2v-2H8V9H6v2H4v2h2z"/><circle cx="14.5" cy="12.5" r="1.5"/><circle cx="18.5" cy="12.5" r="1.5"/></svg>',
        smm: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1h.5c.2 0 .5-.1.7-.3L13.5 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14h-6.5l-1 1H9v-1H4V4h16v12z"/></svg>',
        copy: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
        refresh: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
        back: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>'
    }
};

const SERVICE_PRICES = {
    sim: {
        'mpt-3gb': { name: 'MPT 3GB/7Days', price: 1500 },
        'mpt-5gb': { name: 'MPT 5GB/30Days', price: 2500 },
        'mpt-10gb': { name: 'MPT 10GB/30Days', price: 4500 },
        'telenor-2gb': { name: 'Telenor 2GB/7Days', price: 1200 },
        'telenor-5gb': { name: 'Telenor 5GB/30Days', price: 3000 },
        'ooredoo-3gb': { name: 'Ooredoo 3GB/7Days', price: 1400 },
        'ooredoo-8gb': { name: 'Ooredoo 8GB/30Days', price: 3800 }
    },
    game: {
        'freefire-100': { name: 'Free Fire 100 Diamonds', price: 3000 },
        'freefire-310': { name: 'Free Fire 310 Diamonds', price: 8500 },
        'freefire-520': { name: 'Free Fire 520 Diamonds', price: 13500 },
        'pubg-60': { name: 'PUBG Mobile 60 UC', price: 2000 },
        'pubg-325': { name: 'PUBG Mobile 325 UC', price: 9500 },
        'pubg-660': { name: 'PUBG Mobile 660 UC', price: 18500 },
        'ml-50': { name: 'Mobile Legends 50 Diamonds', price: 1800 },
        'ml-100': { name: 'Mobile Legends 100 Diamonds', price: 3500 }
    },
    smm: {
        'fb-likes': { name: 'Facebook Likes', price: 2000, unit: 1000 },
        'fb-followers': { name: 'Facebook Followers', price: 1500, unit: 1000 },
        'ig-likes': { name: 'Instagram Likes', price: 1800, unit: 1000 },
        'ig-followers': { name: 'Instagram Followers', price: 2000, unit: 1000 },
        'yt-views': { name: 'YouTube Views', price: 2500, unit: 1000 },
        'yt-likes': { name: 'YouTube Likes', price: 3000, unit: 1000 },
        'tt-followers': { name: 'TikTok Followers', price: 2200, unit: 1000 },
        'tt-likes': { name: 'TikTok Likes', price: 1800, unit: 1000 }
    }
};

const GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// === Theme Management ===
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateLogo(theme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    updateLogo(theme) {
        const logo = document.getElementById('mainLogo');
        if (logo) {
            logo.src = EXTERNAL_ASSETS.logo[theme];
        }
    }
}

// === User Management ===
class UserManager {
    constructor() {
        this.userId = this.getUserId();
        this.init();
    }

    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    init() {
        this.updateProfileSection();
    }

    updateProfileSection() {
        const userIdElement = document.getElementById('userId');
        const profilePicture = document.getElementById('profilePicture');

        if (userIdElement) {
            userIdElement.textContent = this.userId;
        }

        if (profilePicture) {
            this.loadProfilePicture(profilePicture);
        }

        this.updateDeviceInfo();
    }

    loadProfilePicture(imgElement) {
        const profileUrl = `${EXTERNAL_ASSETS.profile.baseUrl}${this.userId}.jpg`;
        imgElement.src = profileUrl;
        imgElement.onerror = () => {
            imgElement.src = EXTERNAL_ASSETS.profile.default;
        };
    }

    updateDeviceInfo() {
        const deviceInfo = document.getElementById('deviceInfo');
        if (deviceInfo) {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            deviceInfo.textContent = isMobile ? 'Mobile Device' : 'Desktop Device';
        }
    }
}

// === Form Management ===
class FormManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Service selection changes
        document.addEventListener('change', (e) => {
            if (e.target.name === 'service') {
                this.updatePrice(e.target);
            }
            if (e.target.name === 'quantity') {
                this.calculateTotal(e.target);
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit(e.target);
        });

        // Copy buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
                this.handleCopy(e);
            }
        });
    }

    updatePrice(selectElement) {
        const form = selectElement.closest('form');
        const category = form.dataset.category;
        const serviceId = selectElement.value;
        const priceElement = form.querySelector('.price-display');

        if (priceElement && SERVICE_PRICES[category] && SERVICE_PRICES[category][serviceId]) {
            const service = SERVICE_PRICES[category][serviceId];
            priceElement.textContent = `${service.price} MMK`;
            this.calculateTotal(selectElement);
        }
    }

    calculateTotal(triggerElement) {
        const form = triggerElement.closest('form');
        const quantityInput = form.querySelector('input[name="quantity"]');
        const serviceSelect = form.querySelector('select[name="service"]');
        const totalElement = form.querySelector('.total-display');

        if (quantityInput && serviceSelect && totalElement) {
            const quantity = parseInt(quantityInput.value) || 0;
            const category = form.dataset.category;
            const serviceId = serviceSelect.value;

            if (SERVICE_PRICES[category] && SERVICE_PRICES[category][serviceId]) {
                const service = SERVICE_PRICES[category][serviceId];
                const total = service.price * quantity;
                totalElement.textContent = `${total} MMK`;
            }
        }
    }

    async handleFormSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<div class="spinner"></div> Processing...';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Add user info
            data.userId = userManager.userId;
            data.timestamp = new Date().toISOString();

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('Order submitted successfully!', 'success');
                form.reset();
                
                // Redirect to status page after successful order
                setTimeout(() => {
                    window.location.href = 'status.html';
                }, 2000);
            } else {
                throw new Error(result.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Form submission error:', error);
            this.showToast('Failed to submit order. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    handleCopy(e) {
        const button = e.target.classList.contains('copy-btn') ? e.target : e.target.closest('.copy-btn');
        const textToCopy = button.dataset.copy;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.showToast('Copied to clipboard!', 'success');
            
            // Visual feedback
            const originalHTML = button.innerHTML;
            button.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
            }, 2000);
        }).catch(() => {
            this.showToast('Failed to copy text', 'error');
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor">
                ${this.getToastIcon(type)}
            </svg>
            <span>${message}</span>
        `;

        const container = document.getElementById('toastContainer') || this.createToastContainer();
        container.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
            error: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
            info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>'
        };
        return icons[type] || icons.info;
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
}

// === Tab Management ===
class TabManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab') || e.target.closest('.tab')) {
                const tab = e.target.classList.contains('tab') ? e.target : e.target.closest('.tab');
                this.switchTab(tab.dataset.tab);
            }
        });
    }

    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });

        // Load data for the tab if needed
        if (typeof this.loadTabData === 'function') {
            this.loadTabData(tabId);
        }
    }
}

// === Accordion Management ===
class AccordionManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('accordion-header') || e.target.closest('.accordion-header')) {
                const header = e.target.classList.contains('accordion-header') ? e.target : e.target.closest('.accordion-header');
                const accordion = header.parentElement;
                this.toggleAccordion(accordion);
            }
        });
    }

    toggleAccordion(accordion) {
        const isActive = accordion.classList.contains('active');
        
        // Close all accordions
        document.querySelectorAll('.accordion').forEach(acc => {
            acc.classList.remove('active');
        });

        // Open clicked accordion if it wasn't active
        if (!isActive) {
            accordion.classList.add('active');
        }
    }
}

// === Order Status Management ===
class OrderStatusManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-orders') || e.target.closest('.refresh-orders')) {
                this.refreshOrders();
            }
        });
    }

    async refreshOrders() {
        const refreshBtn = document.querySelector('.refresh-orders');
        const originalHTML = refreshBtn.innerHTML;

        try {
            refreshBtn.innerHTML = '<div class="spinner"></div>';
            
            const response = await fetch(`${GAS_URL}?action=list&userId=${userManager.userId}`);
            const orders = await response.json();
            
            this.displayOrders(orders);
            formManager.showToast('Orders updated!', 'success');
        } catch (error) {
            console.error('Error fetching orders:', error);
            formManager.showToast('Failed to update orders', 'error');
        } finally {
            refreshBtn.innerHTML = originalHTML;
        }
    }

    displayOrders(orders) {
        const container = document.getElementById('ordersContainer');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="text-center">No orders found</div>';
            return;
        }

        const ordersHTML = orders.map(order => `
            <tr>
                <td>${order.orderId}</td>
                <td>${order.service}</td>
                <td>${order.quantity}</td>
                <td>${order.total} MMK</td>
                <td>
                    <span class="status-badge status-${order.status.toLowerCase()}">
                        <svg class="icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            ${this.getStatusIcon(order.status)}
                        </svg>
                        ${order.status}
                    </span>
                </td>
                <td>${new Date(order.timestamp).toLocaleDateString()}</td>
            </tr>
        `).join('');

        container.innerHTML = ordersHTML;
    }

    getStatusIcon(status) {
        const icons = {
            'Pending': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5"/>',
            'Processing': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6v6l4 2"/>',
            'Success': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
            'Cancelled': '<path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M15 9l-6 6m0-6l6 6"/>'
        };
        return icons[status] || icons.Pending;
    }
}

// === Payment Method Selection ===
class PaymentManager {
    constructor() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('payment-method') || e.target.closest('.payment-method')) {
                const method = e.target.classList.contains('payment-method') ? e.target : e.target.closest('.payment-method');
                this.selectPaymentMethod(method);
            }
        });
    }

    selectPaymentMethod(method) {
        // Deselect all methods
        document.querySelectorAll('.payment-method').forEach(m => {
            m.classList.remove('selected');
        });

        // Select clicked method
        method.classList.add('selected');

        // Update hidden input if it exists
        const paymentInput = document.querySelector('input[name="payment"]');
        if (paymentInput) {
            paymentInput.value = method.dataset.method;
        }
    }
}

// === Initialize Application ===
let themeManager, userManager, formManager, tabManager, accordionManager, orderStatusManager, paymentManager;

document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
    userManager = new UserManager();
    formManager = new FormManager();
    tabManager = new TabManager();
    accordionManager = new AccordionManager();
    orderStatusManager = new OrderStatusManager();
    paymentManager = new PaymentManager();

    // Update navigation active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });

    // Initialize any page-specific functionality
    this.initializePageSpecificFeatures();
});

function initializePageSpecificFeatures() {
    // Dashboard stats (mock data)
    const totalOrders = document.getElementById('totalOrders');
    const totalExchange = document.getElementById('totalExchange');
    
    if (totalOrders) totalOrders.textContent = '1,247';
    if (totalExchange) totalExchange.textContent = '2,584,500 MMK';

    // Update SVG icons
    this.updateSvgIcons();
}

function updateSvgIcons() {
    // Update navigation icons
    document.querySelectorAll('.nav-icon').forEach(icon => {
        const iconName = icon.dataset.icon;
        if (EXTERNAL_ASSETS.icons[iconName]) {
            icon.innerHTML = EXTERNAL_ASSETS.icons[iconName];
        }
    });

    // Update other icons as needed
    document.querySelectorAll('.icon[data-icon]').forEach(icon => {
        const iconName = icon.dataset.icon;
        if (EXTERNAL_ASSETS.icons[iconName]) {
            icon.innerHTML = EXTERNAL_ASSETS.icons[iconName];
        }
    });
}

// Utility function for external asset loading
function loadExternalAsset(url, element, fallback) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            element.src = url;
            resolve(true);
        };
        img.onerror = () => {
            element.src = fallback;
            resolve(false);
        };
        img.src = url;
    });
}
