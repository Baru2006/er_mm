const GAS_URL = 'https://script.google.com/macros/s/AKfycbztNW-dCFcxLz_IM9gVNQhbve-dujt1UtwoZrcQwtn-agcGjWh6QTOjZbX6lHXuE2pNyA/exec';

const simPackages = {
    MPT: {'3GB': 1500, '5GB': 2500},
    Telenor: {'1GB': 1000},
    Ooredoo: {'2GB': 2000}
};

const gamePackages = {
    'Free Fire': 3000,
    'PUBG': 2000,
    'Mobile Legends': 2500
};

const smmPrices = {
    'Facebook': 2000,
    'Instagram': 4000,
    'YouTube': 8000
};

document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeEventListeners();
    
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
        fetchStats();
        fetchOrders();
    }
});

function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
    }
}

function initializeEventListeners() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('order_sim.html')) {
        populateSimPackages();
    } else if (currentPage.includes('order_game.html')) {
        populateGamePackages();
    } else if (currentPage.includes('order_smm.html')) {
        populateSMMPrices();
    } else if (currentPage.includes('pay.html')) {
        document.getElementById('amount')?.addEventListener('input', calculateP2P);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function populateSimPackages() {
    const network = document.getElementById('network');
    const pkg = document.getElementById('package');
    const qty = document.getElementById('qty');
    const total = document.getElementById('total');
    
    if (!network || !pkg) return;
    
    network.addEventListener('change', updateSimPackages);
    pkg.addEventListener('change', calculateSimTotal);
    qty?.addEventListener('input', calculateSimTotal);
    
    updateSimPackages();
}

function updateSimPackages() {
    const network = document.getElementById('network');
    const pkg = document.getElementById('package');
    
    if (!network || !pkg) return;
    
    pkg.innerHTML = '<option value="">Select Package</option>';
    
    const packages = simPackages[network.value];
    if (packages) {
        for (const [packageName, price] of Object.entries(packages)) {
            const option = document.createElement('option');
            option.value = packageName;
            option.textContent = `${packageName} - ${price} MMK`;
            pkg.appendChild(option);
        }
    }
    
    calculateSimTotal();
}

function calculateSimTotal() {
    const network = document.getElementById('network');
    const pkg = document.getElementById('package');
    const qty = document.getElementById('qty');
    const total = document.getElementById('total');
    
    if (!network || !pkg || !qty || !total) return;
    
    if (network.value && pkg.value && qty.value) {
        const price = simPackages[network.value]?.[pkg.value];
        if (price) {
            const totalAmount = price * parseInt(qty.value);
            total.textContent = totalAmount + ' MMK';
        }
    } else {
        total.textContent = '0 MMK';
    }
}

function populateGamePackages() {
    const game = document.getElementById('game');
    const qty = document.getElementById('qty');
    
    if (!game || !qty) return;
    
    game.addEventListener('change', calculateGameTotal);
    qty.addEventListener('input', calculateGameTotal);
    
    calculateGameTotal();
}

function calculateGameTotal() {
    const game = document.getElementById('game');
    const qty = document.getElementById('qty');
    const total = document.getElementById('total');
    
    if (!game || !qty || !total) return;
    
    if (game.value && qty.value) {
        const price = gamePackages[game.value];
        if (price) {
            const totalAmount = price * parseInt(qty.value);
            total.textContent = totalAmount + ' MMK';
        }
    } else {
        total.textContent = '0 MMK';
    }
}

function populateSMMPrices() {
    const platform = document.getElementById('platform');
    const qty = document.getElementById('qty');
    
    if (!platform || !qty) return;
    
    platform.addEventListener('change', calculateSMMTotal);
    qty.addEventListener('input', calculateSMMTotal);
    
    calculateSMMTotal();
}

function calculateSMMTotal() {
    const platform = document.getElementById('platform');
    const qty = document.getElementById('qty');
    const total = document.getElementById('total');
    
    if (!platform || !qty || !total) return;
    
    if (platform.value && qty.value) {
        const price = smmPrices[platform.value];
        if (price) {
            const quantity = parseInt(qty.value);
            const totalAmount = (price * quantity) / 100;
            total.textContent = totalAmount + ' MMK';
        }
    } else {
        total.textContent = '0 MMK';
    }
}

function calculateP2P() {
    const amountInput = document.getElementById('amount');
    const amountDisplay = document.getElementById('amount-display');
    const feeDisplay = document.getElementById('fee');
    const receiveDisplay = document.getElementById('receive');
    
    if (!amountInput || !feeDisplay || !receiveDisplay) return;
    
    const amount = parseFloat(amountInput.value) || 0;
    const fee = amount * 0.02;
    const receive = amount - fee;
    
    if (amountDisplay) {
        amountDisplay.textContent = amount.toLocaleString() + ' MMK';
    }
    feeDisplay.textContent = fee.toFixed(0) + ' MMK';
    receiveDisplay.textContent = receive.toFixed(0) + ' MMK';
}

function submitOrderForm(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    data.userId = 'user_' + Math.random().toString(36).substr(2, 9);
    data.timestamp = new Date().toISOString();
    
    showToast('Submitting order...', 'info');
    
    fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showToast(`Order submitted successfully! TXID: ${result.txid}`, 'success');
            form.reset();
            
            if (typeof calculateSimTotal === 'function') calculateSimTotal();
            if (typeof calculateGameTotal === 'function') calculateGameTotal();
            if (typeof calculateSMMTotal === 'function') calculateSMMTotal();
            if (typeof calculateP2P === 'function') calculateP2P();
            
            setTimeout(() => {
                window.location.href = 'status.html';
            }, 2000);
        } else {
            throw new Error('Order submission failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Order submission failed. Please try again.', 'error');
    });
}

function fetchOrders() {
    const ordersList = document.getElementById('orders-list');
    
    if (!ordersList) return;
    
    ordersList.innerHTML = '<div class="loading-state">Loading orders...</div>';
    
    fetch(GAS_URL + '?action=getOrders')
        .then(response => response.json())
        .then(orders => {
            if (orders.length === 0) {
                ordersList.innerHTML = '<div class="empty-state">No orders yet</div>';
                return;
            }
            
            ordersList.innerHTML = '';
            orders.forEach(order => {
                const orderElement = createOrderElement(order);
                ordersList.appendChild(orderElement);
            });
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            ordersList.innerHTML = '<div class="empty-state">Failed to load orders</div>';
        });
}

function createOrderElement(order) {
    const div = document.createElement('div');
    div.className = 'card';
    
    const statusClass = getStatusClass(order.Status);
    
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <strong style="font-size: 0.9rem;">${order.OrderID}</strong>
            <span class="status-badge ${statusClass}">${order.Status}</span>
        </div>
        <p style="margin-bottom: 0.5rem; font-size: 0.9rem;">Service: ${order.Service}</p>
        <p style="font-size: 0.8rem; opacity: 0.7;">Click to copy TXID</p>
    `;
    
    div.style.cursor = 'pointer';
    div.addEventListener('click', () => {
        copyText(order.OrderID);
        showToast('Transaction ID copied!', 'success');
    });
    
    return div;
}

function getStatusClass(status) {
    switch (status) {
        case 'Completed': return 'status-completed';
        case 'Processing': return 'status-processing';
        case 'Pending': return 'status-pending';
        case 'Failed': return 'status-failed';
        default: return 'status-pending';
    }
}

function fetchStats() {
    const totalOrders = document.getElementById('total-orders');
    const totalRevenue = document.getElementById('total-revenue');
    
    if (!totalOrders || !totalRevenue) return;
    
    fetch(GAS_URL + '?action=getStats')
        .then(response => response.json())
        .then(stats => {
            animateCounter(totalOrders, stats.totalOrders || 0);
            animateCounter(totalRevenue, stats.totalRevenue || 0, true);
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            totalOrders.textContent = '0';
            totalRevenue.textContent = '0 MMK';
        });
}

function animateCounter(element, target, isCurrency = false) {
    const duration = 1000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        if (isCurrency) {
            element.textContent = Math.floor(current).toLocaleString() + ' MMK';
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

function copyText(text) {
    navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy text: ', err);
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function generateUserAvatar(userId) {
    const colors = ['#ff7b00', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];
    const color = colors[userId.length % colors.length];
    
    const svg = `
        <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="20" fill="${color}"/>
            <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
                ${userId.charAt(0).toUpperCase()}
            </text>
        </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
}

const statusStyles = `
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    .status-completed { background: #10b981; color: white; }
    .status-processing { background: #3b82f6; color: white; }
    .status-pending { background: #f59e0b; color: white; }
    .status-failed { background: #ef4444; color: white; }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = statusStyles;
document.head.appendChild(styleSheet);
