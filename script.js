const GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

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
        'fb-likes': 2000,
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

// User session management
class UserSession {
    constructor() {
        this.userId = this.getUserId();
    }

    getUserId() {
        let userId = localStorage.getItem('easyrecharge_userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('easyrecharge_userId', userId);
        }
        return userId;
    }

    getUserData() {
        return {
            userId: this.userId,
            timestamp: new Date().toISOString()
        };
    }
}

const userSession = new UserSession();

// Toast notification system
class Toast {
    static show(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, duration);
        }
    }

    static getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }
}

// Form validation utilities
class Validator {
    static validatePhone(phone) {
        const regex = /^09\d{7,9}$/;
        return regex.test(phone);
    }

    static validateTransactionId(id) {
        return id && id.length >= 6;
    }

    static validateAmount(amount) {
        return !isNaN(amount) && amount > 0;
    }

    static validateGameId(id) {
        return id && id.length >= 3;
    }

    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// API communication
class EasyRechargeAPI {
    static async post(endpoint, data) {
        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: endpoint,
                    ...data,
                    userId: userSession.userId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.message || 'Request failed');
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    static async get(endpoint, params = {}) {
        try {
            const queryString = new URLSearchParams({
                action: endpoint,
                userId: userSession.userId,
                ...params
            }).toString();

            const response = await fetch(`${GAS_URL}?${queryString}`);
            const result = await response.json();
            
            if (result.success) {
                return result;
            } else {
                throw new Error(result.message || 'Request failed');
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
}

// Order management
class OrderManager {
    static async submitOrder(orderData) {
        try {
            const result = await EasyRechargeAPI.post('submitOrder', orderData);
            Toast.show('Order submitted successfully! Order ID: ' + result.orderId, 'success');
            return result;
        } catch (error) {
            Toast.show('Failed to submit order: ' + error.message, 'error');
            throw error;
        }
    }

    static async getOrders(filter = 'all', limit = 10) {
        try {
            const result = await EasyRechargeAPI.get('getOrders', { filter, limit });
            return result.data;
        } catch (error) {
            Toast.show('Failed to load orders: ' + error.message, 'error');
            return [];
        }
    }

    static async getDashboardStats() {
        try {
            const result = await EasyRechargeAPI.get('getDashboardStats');
            return result.data;
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            return null;
        }
    }
}

// Price calculation utilities
class PriceCalculator {
    static calculateSIMTotal(serviceId) {
        return SERVICE_PRICES.sim[serviceId] || 0;
    }

    static calculateGameTotal(gameId, quantity = 1) {
        const basePrice = SERVICE_PRICES.game[gameId] || 0;
        return basePrice * quantity;
    }

    static calculateSMMTotal(serviceId, quantity = 100) {
        const basePrice = SERVICE_PRICES.smm[serviceId] || 0;
        return basePrice * (quantity / 100);
    }

    static calculateP2PAmount(amount, feePercent = 2) {
        const fee = amount * (feePercent / 100);
        const receive = amount - fee;
        return { sent: amount, fee, receive };
    }
}

// DOM utilities
class DOMUtils {
    static showLoading(element) {
        element.classList.add('loading');
        const originalText = element.innerHTML;
        element.innerHTML = '<div class="loading-spinner"></div> Processing...';
        element.disabled = true;
        return () => {
            element.classList.remove('loading');
            element.innerHTML = originalText;
            element.disabled = false;
        };
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-US').format(amount) + ' MMK';
    }

    static formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static getStatusBadge(status) {
        const statusClass = {
            pending: 'status-pending',
            processing: 'status-processing',
            completed: 'status-completed',
            cancelled: 'status-cancelled'
        }[status] || 'status-pending';

        return `<span class="status-badge ${statusClass}">${status}</span>`;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('totalOrders')) {
        initializeDashboard();
    }

    // Initialize phone input validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.startsWith('09')) {
                value = value.substring(0, 11);
            }
            e.target.value = value;
            
            if (value.length >= 9 && value.length <= 11) {
                e.target.classList.remove('error');
            } else {
                e.target.classList.add('error');
            }
        });
    });

    // Initialize real-time calculations
    initializeCalculations();
});

async function initializeDashboard() {
    try {
        const stats = await OrderManager.getDashboardStats();
        if (stats) {
            document.getElementById('totalOrders').textContent = stats.totalOrders;
            document.getElementById('totalSpent').textContent = DOMUtils.formatCurrency(stats.totalSpent);
            document.getElementById('pendingOrders').textContent = stats.pendingOrders;
        }

        const orders = await OrderManager.getOrders('all', 5);
        updateRecentOrdersTable(orders);
    } catch (error) {
        console.error('Dashboard initialization failed:', error);
    }
}

function updateRecentOrdersTable(orders) {
    const table = document.getElementById('recentOrdersTable');
    if (!table) return;

    if (orders.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    No recent orders found
                </td>
            </tr>
        `;
        return;
    }

    table.innerHTML = orders.map(order => `
        <tr class="border-b border-gray-100">
            <td class="py-4 text-sm font-medium text-gray-900">${order.orderId}</td>
            <td class="py-4 text-sm text-gray-600">${order.serviceType}</td>
            <td class="py-4 text-sm text-gray-600">${DOMUtils.formatCurrency(order.amount)}</td>
            <td class="py-4">${DOMUtils.getStatusBadge(order.status)}</td>
            <td class="py-4 text-sm text-gray-500">${DOMUtils.formatDate(order.timestamp)}</td>
        </tr>
    `).join('');
}

function initializeCalculations() {
    // SIM recharge calculation
    const simServiceSelect = document.getElementById('simService');
    const simTotalElement = document.getElementById('simTotal');
    
    if (simServiceSelect && simTotalElement) {
        simServiceSelect.addEventListener('change', function() {
            const total = PriceCalculator.calculateSIMTotal(this.value);
            simTotalElement.textContent = DOMUtils.formatCurrency(total);
        });
    }

    // Game top-up calculation
    const gameServiceSelect = document.getElementById('gameService');
    const gameQuantityInput = document.getElementById('gameQuantity');
    const gameTotalElement = document.getElementById('gameTotal');
    
    if (gameServiceSelect && gameQuantityInput && gameTotalElement) {
        const calculateGameTotal = () => {
            const total = PriceCalculator.calculateGameTotal(
                gameServiceSelect.value,
                parseInt(gameQuantityInput.value) || 1
            );
            gameTotalElement.textContent = DOMUtils.formatCurrency(total);
        };

        gameServiceSelect.addEventListener('change', calculateGameTotal);
        gameQuantityInput.addEventListener('input', calculateGameTotal);
    }

    // SMM service calculation
    const smmServiceSelect = document.getElementById('smmService');
    const smmQuantityInput = document.getElementById('smmQuantity');
    const smmTotalElement = document.getElementById('smmTotal');
    
    if (smmServiceSelect && smmQuantityInput && smmTotalElement) {
        const calculateSMMTotal = () => {
            const total = PriceCalculator.calculateSMMTotal(
                smmServiceSelect.value,
                parseInt(smmQuantityInput.value) || 100
            );
            smmTotalElement.textContent = DOMUtils.formatCurrency(total);
        };

        smmServiceSelect.addEventListener('change', calculateSMMTotal);
        smmQuantityInput.addEventListener('input', calculateSMMTotal);
    }

    // P2P exchange calculation
    const p2pAmountInput = document.getElementById('p2pAmount');
    const p2pFeeElement = document.getElementById('p2pFee');
    const p2pReceiveElement = document.getElementById('p2pReceive');
    
    if (p2pAmountInput && p2pFeeElement && p2pReceiveElement) {
        p2pAmountInput.addEventListener('input', function() {
            const amount = parseInt(this.value) || 0;
            const { fee, receive } = PriceCalculator.calculateP2PAmount(amount);
            p2pFeeElement.textContent = DOMUtils.formatCurrency(fee);
            p2pReceiveElement.textContent = DOMUtils.formatCurrency(receive);
        });
    }
}

// Form submission handlers
window.submitSIMOrder = async function(form) {
    const formData = new FormData(form);
    const phone = formData.get('phone');
    const service = formData.get('service');
    const paymentMethod = formData.get('paymentMethod');
    const transactionId = formData.get('transactionId');

    if (!Validator.validatePhone(phone)) {
        Toast.show('Please enter a valid Myanmar phone number (09xxxxxxxx)', 'error');
        return false;
    }

    if (!Validator.validateTransactionId(transactionId)) {
        Toast.show('Please enter a valid transaction ID', 'error');
        return false;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const resetLoading = DOMUtils.showLoading(submitBtn);

    try {
        await OrderManager.submitOrder({
            type: 'sim',
            phone: phone,
            service: service,
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            amount: PriceCalculator.calculateSIMTotal(service)
        });

        form.reset();
        document.getElementById('simTotal').textContent = '0 MMK';
        return false;
    } catch (error) {
        return false;
    } finally {
        resetLoading();
    }
};

window.submitGameOrder = async function(form) {
    const formData = new FormData(form);
    const gameId = formData.get('gameId');
    const service = formData.get('service');
    const quantity = formData.get('quantity');
    const paymentMethod = formData.get('paymentMethod');
    const transactionId = formData.get('transactionId');

    if (!Validator.validateGameId(gameId)) {
        Toast.show('Please enter a valid Game ID/Username', 'error');
        return false;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const resetLoading = DOMUtils.showLoading(submitBtn);

    try {
        await OrderManager.submitOrder({
            type: 'game',
            gameId: gameId,
            service: service,
            quantity: parseInt(quantity),
            paymentMethod: paymentMethod,
            transactionId: transactionId,
            amount: PriceCalculator.calculateGameTotal(service, parseInt(quantity))
        });

        form.reset();
        document.getElementById('gameTotal').textContent = '0 MMK';
        return false;
    } catch (error) {
        return false;
    } finally {
        resetLoading();
    }
};

// Utility functions for copy functionality
window.copyToClipboard = async function(text) {
    try {
        await navigator.clipboard.writeText(text);
        Toast.show('Copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy: ', err);
        Toast.show('Failed to copy to clipboard', 'error');
    }
};

// Auto-refresh functionality for status page
let autoRefreshInterval;
window.startAutoRefresh = function(interval = 15000) {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(async () => {
        if (document.getElementById('ordersTable')) {
            await loadOrders();
            document.getElementById('lastUpdate').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
        }
    }, interval);
};

window.stopAutoRefresh = function() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
};
