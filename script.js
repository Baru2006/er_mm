// EasyRecharge MM - Frontend JavaScript
const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyn8TMG-IrnEC8IJkgE5Ag95W2pLgn9oKY_wgHhUsvfpPZoYB2_Mi9Zrgbukz4jAdUHHg/exec',
    VERSION: '1.0.0'
};

// Service Prices
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

// User Session Management
class UserSession {
    constructor() {
        this.userId = this.getUserId();
        this.initializeSession();
    }

    getUserId() {
        let userId = localStorage.getItem('easyrecharge_userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('easyrecharge_userId', userId);
        }
        return userId;
    }

    initializeSession() {
        if (!localStorage.getItem('easyrecharge_initialized')) {
            localStorage.setItem('easyrecharge_initialized', 'true');
            localStorage.setItem('easyrecharge_orders', JSON.stringify([]));
        }
    }

    getUserInfo() {
        return {
            userId: this.userId,
            sessionStart: localStorage.getItem('easyrecharge_session_start')
        };
    }
}

// API Service
class ApiService {
    constructor() {
        this.baseUrl = CONFIG.GAS_URL;
    }

    async makeRequest(endpoint, data = null, method = 'GET') {
        try {
            const url = new URL(this.baseUrl);
            
            if (method === 'GET' && data) {
                Object.keys(data).forEach(key => {
                    url.searchParams.append(key, data[key]);
                });
            }

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                redirect: 'follow'
            };

            if (method === 'POST' && data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url.toString(), options);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Request failed');
            }

            return result.data;

        } catch (error) {
            console.error('API Request Error:', error);
            this.showToast('Server error: ' + error.message, 'error');
            throw error;
        }
    }

    async getOrders(userId, filter = 'all', limit = 50) {
        return this.makeRequest('', {
            action: 'get_orders',
            userId: userId,
            filter: filter,
            limit: limit
        });
    }

    async getStats(userId) {
        return this.makeRequest('', {
            action: 'get_stats',
            userId: userId
        });
    }

    async submitOrder(orderData) {
        return this.makeRequest('', {
            action: 'submit_order',
            orderData: orderData
        }, 'POST');
    }

    async getAdminOrders(filter = 'all', limit = 100) {
        return this.makeRequest('', {
            action: 'get_admin_orders',
            filter: filter,
            limit: limit
        });
    }

    async updateOrderStatus(orderId, sheetName, status) {
        return this.makeRequest('', {
            action: 'update_status',
            orderId: orderId,
            sheetName: sheetName,
            status: status
        }, 'POST');
    }
}

// UI Utilities
class UIUtils {
    static showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        if (!toast || !toastMessage || !toastIcon) return;

        // Set icon based on type
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        // Set background color based on type
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        toastIcon.className = `fas ${icons[type] || icons.info}`;
        toast.className = `fixed top-4 right-4 ${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300 z-50`;
        toastMessage.textContent = message;

        // Show toast
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);

        // Hide toast after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
        }, 5000);
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('my-MM', {
            style: 'currency',
            currency: 'MMK'
        }).format(amount);
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('my-MM', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    static validatePhoneNumber(phone) {
        const regex = /^09\d{7,9}$/;
        return regex.test(phone);
    }

    static showLoading(element) {
        if (element) {
            element.innerHTML = `
                <div class="text-center py-4">
                    <div class="loading-spinner mx-auto mb-2"></div>
                    <p class="text-gray-500">တင်နေသည်...</p>
                </div>
            `;
        }
    }

    static hideLoading(element, content = '') {
        if (element) {
            element.innerHTML = content;
        }
    }
}

// Form Validator
class FormValidator {
    static validateSIMForm(formData) {
        const errors = {};

        if (!formData.phone) {
            errors.phone = 'ဖုန်းနံပါတ်ထည့်ပါ';
        } else if (!UIUtils.validatePhoneNumber(formData.phone)) {
            errors.phone = 'မှန်ကန်သောဖုန်းနံပါတ်ထည့်ပါ (09xxxxxxxx)';
        }

        if (!formData.service) {
            errors.service = 'ဝန်ဆောင်မှုရွေးပါ';
        }

        if (!formData.payment) {
            errors.payment = 'ငွေချေနည်းရွေးပါ';
        }

        if (!formData.transactionId) {
            errors.transactionId = 'Transaction ID ထည့်ပါ';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }

    static validateGameForm(formData) {
        const errors = {};

        if (!formData.gameId) {
            errors.gameId = 'Game ID ထည့်ပါ';
        }

        if (!formData.game) {
            errors.game = 'ဂိမ်းရွေးပါ';
        }

        if (!formData.quantity || formData.quantity < 1) {
            errors.quantity = 'အရေအတွက်ထည့်ပါ';
        }

        if (!formData.payment) {
            errors.payment = 'ငွေချေနည်းရွေးပါ';
        }

        if (!formData.transactionId) {
            errors.transactionId = 'Transaction ID ထည့်ပါ';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors: errors
        };
    }
}

// Initialize Dashboard
function initializeDashboard() {
    const userSession = new UserSession();
    const apiService = new ApiService();

    // Update welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `User: ${userSession.userId}`;
    }

    // Load statistics
    loadDashboardStats(userSession, apiService);

    // Load recent orders
    loadRecentOrders(userSession, apiService);
}

async function loadDashboardStats(userSession, apiService) {
    try {
        const stats = await apiService.getStats(userSession.userId);
        
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('totalSpent').textContent = UIUtils.formatCurrency(stats.totalSpent || 0);
        document.getElementById('pendingOrders').textContent = stats.pendingOrders || 0;

    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadRecentOrders(userSession, apiService) {
    try {
        const orders = await apiService.getOrders(userSession.userId, 'all', 5);
        displayRecentOrders(orders);

    } catch (error) {
        console.error('Failed to load orders:', error);
        document.getElementById('recentOrders').innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-exclamation-circle text-3xl mb-2"></i>
                <p>အချက်အလက်များ ရယူ၍မရပါ</p>
            </div>
        `;
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrders');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-shopping-cart text-3xl mb-2"></i>
                <p>အမှာစာမရှိသေးပါ</p>
                <a href="services.html" class="text-blue-600 hover:underline mt-2 inline-block">ဝန်ဆောင်မှုများ ကြည့်ရန်</a>
            </div>
        `;
        return;
    }

    const ordersHtml = orders.map(order => `
        <div class="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex-1">
                <div class="flex items-center space-x-3">
                    <span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
                    <span class="text-sm text-gray-600">${order.orderid}</span>
                </div>
                <p class="text-sm text-gray-800 mt-1">${order.service || order.platform || 'N/A'}</p>
            </div>
            <div class="text-right">
                <p class="font-medium text-gray-900">${UIUtils.formatCurrency(order.total || 0)}</p>
                <p class="text-xs text-gray-500">${UIUtils.formatDate(order.timestamp)}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = ordersHtml;
}

function getStatusClass(status) {
    const statusMap = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'completed': 'status-completed',
        'success': 'status-completed',
        'cancelled': 'status-cancelled',
        'failed': 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'ဆောင်ရွက်ဆဲ',
        'processing': 'လုပ်ဆောင်နေသည်',
        'completed': 'ပြီးစီးသည်',
        'success': 'အောင်မြင်သည်',
        'cancelled': 'ပယ်ဖျက်သည်',
        'failed': 'မအောင်မြင်ပါ'
    };
    return statusMap[status?.toLowerCase()] || status || 'ဆောင်ရွက်ဆဲ';
}

// Global initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize user session
    window.userSession = new UserSession();
    window.apiService = new ApiService();
    window.uiUtils = UIUtils;
    window.formValidator = FormValidator;

    console.log('EasyRecharge MM Frontend Initialized');
});
