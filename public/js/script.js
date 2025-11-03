// EasyRecharge MM - Core JavaScript
// Handles:
// 1. User Session (localStorage)
// 2. Theme Switching
// 3. API Communication
// 4. Toast Notifications
// 5. Mobile Navigation
// 6. Dynamic Content Loading (Dashboard)
// 7. Form Helpers

// This file stores all the service prices for the frontend.
// The frontend (script.js) will import and use this object.

const SERVICE_PRICES = {
  // SIM Card Packages (MMK)
  sim: {
    'mpt-1gb': 900,
    'mpt-3gb': 2500,
    'mpt-5gb': 4000,
    'atom-1gb': 900,
    'atom-3gb': 2500,
    'ooredoo-1gb': 950,
    'ooredoo-3gb': 2600,
    'mytel-1gb': 850,
  },
  
  // Game Top-up (MMK)
  game: {
    'freefire-115d': 3000,
    'freefire-240d': 6000,
    'freefire-590d': 12000,
    'pubg-60uc': 2000,
    'pubg-325uc': 9000,
    'mlbb-86d': 2500,
    'mlbb-172d': 5000,
    'mlbb-257d': 7500,
  },
  
  // SMM Services (MMK per 1000 units)
  smm: {
    // Facebook
    'fb-likes': 2000,      // Page Likes
    'fb-followers': 4000, // Profile/Page Followers
    'fb-views': 1500,     // Video Views
    'fb-post-react': 1000, // Post Reactions
    
    // Instagram
    'ig-followers': 4000,
    'ig-likes': 2000,
    'ig-comments': 3000,
    'ig-views': 1000,
    
    // YouTube
    'yt-subscribers': 8000,
    'yt-views': 2500,
    'yt-likes': 1500,
    
    // TikTok
    'tt-followers': 5000,
    'tt-likes': 1500,
    'tt-views': 1000,
  }
};

// P2P Exchange Fee
const P2P_FEE_PERCENTAGE = 2; // 2% fee

// Make it available for script.js (if not using modules)
// If using ES6 modules, script.js would `import` this.
// For simplicity in this project, we assume script.js will load this file first.


document.addEventListener('DOMContentLoaded', () => {
    // --- Global Config ---
    // API base URL. Use '/api' for production on Vercel.
    const API_BASE_URL = '/api'; 
    // const API_BASE_URL = 'http://localhost:3000/api'; // For local dev with `vercel dev`

    // --- 1. User Session ---
    let USER_ID = localStorage.getItem('easyRechargeUserID');
    if (!USER_ID) {
        USER_ID = `mm-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        localStorage.setItem('easyRechargeUserID', USER_ID);
    }
    console.log(`User ID: ${USER_ID}`);

    // Display User ID and Avatar
    const userIdDisplay = document.getElementById('user-id-display');
    const userAvatar = document.getElementById('user-avatar');
    if (userIdDisplay) {
        userIdDisplay.textContent = USER_ID.slice(0, 16) + '...'; // Shortened
    }
    if (userAvatar) {
        // Generate a unique avatar based on the User ID
        const shortId = USER_ID.split('-')[2] || 'User';
        userAvatar.src = `https://ui-avatars.com/api/?name=${shortId}&background=3b82f6&color=fff&rounded=true`;
    }
    
    // Copy User ID
    const copyUserIdBtn = document.getElementById('copy-user-id');
    if (copyUserIdBtn) {
        copyUserIdBtn.addEventListener('click', () => {
            // Use execCommand for broader compatibility in iframes
            const textarea = document.createElement('textarea');
            textarea.value = USER_ID;
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('User ID copied to clipboard!', 'success');
            } catch (err) {
                console.error('Failed to copy User ID:', err);
                showToast('Failed to copy User ID.', 'error');
            }
            document.body.removeChild(textarea);
        });
    }


    // --- 2. Theme Switching ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const htmlEl = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'system';

    const applyTheme = (theme) => {
        if (theme === 'system') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (theme === 'dark') {
            htmlEl.classList.add('dark');
            if(themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            htmlEl.classList.remove('dark');
            if(themeToggleMobile) themeToggleMobile.innerHTML = '<i class="fas fa-moon"></i>';
        }
        // Update toggle state
        if (themeToggle) {
            const toggleIndicator = themeToggle.querySelector('span');
            if (theme === 'dark') {
                toggleIndicator.classList.add('dark:translate-x-6');
            } else {
                toggleIndicator.classList.remove('dark:translate-x-6');
            }
        }
    };

    const toggleTheme = () => {
        const currentIsDark = htmlEl.classList.contains('dark');
        const newTheme = currentIsDark ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

    // Initial theme load
    applyTheme(savedTheme === 'dark' ? 'dark' : 'light'); // Default to light if system prefs aren't dark


    // --- 3. API Communication (Wrapper) ---
    /**
     * @param {string} endpoint
     * @param {string} method
     * @param {object} [body]
     * @param {boolean} [isAdmin=false]
     */
    window.apiCall = async (endpoint, method = 'GET', body = null, isAdmin = false) => {
        const headers = new Headers({
            'Content-Type': 'application/json',
            'X-User-ID': USER_ID,
        });

        if (isAdmin) {
            // In a real app, this would be a secure auth token.
            // Using email as per prompt for simplicity.
            const adminEmail = localStorage.getItem('adminEmail') || prompt('Enter Admin Email:');
            if (!adminEmail) {
                showToast('Admin email is required.', 'error');
                return null;
            }
            localStorage.setItem('adminEmail', adminEmail);
            headers.append('X-Admin-Email', adminEmail);
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);
            
            if (response.status === 401 || response.status === 403) {
                showToast('Authentication failed. Check User ID or Admin Email.', 'error');
                return null;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `API Error: ${response.status}`);
            }
            
            return await response.json();

        } catch (error) {
            console.error(`API Call Error (${endpoint}):`, error);
            showToast(error.message, 'error');
            return null; // Return null on failure so calling code can handle it
        }
    };

    // --- 4. Toast Notifications ---
    /**
     * @param {string} message
     * @param {'success' | 'error' | 'info'} type
     */
    window.showToast = (message, type = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconClass = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        }[type];
        
        toast.innerHTML = `
            <i class="fas ${iconClass} text-xl"></i>
            <span class="font-medium">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    // --- 5. Mobile Navigation ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');

    const toggleMobileMenu = () => {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('-translate-x-full');
        mobileOverlay.classList.toggle('hidden');
    };

    if (mobileMenuBtn && sidebar && mobileOverlay) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        mobileOverlay.addEventListener('click', toggleMobileMenu);
    }
    
    // --- 6. Dynamic Content Loading (Dashboard) ---
    // Check if we are on the Dashboard page (index.html)
    if (document.body.contains(document.getElementById('stat-total-orders'))) {
        loadDashboardData();
    }

    async function loadDashboardData() {
        // Load Stats
        const statsData = await window.apiCall('get-stats', 'GET');
        if (statsData && statsData.success) {
            document.getElementById('stat-total-orders').textContent = statsData.stats.totalOrders;
            document.getElementById('stat-total-spent').textContent = parseFloat(statsData.stats.totalSpent).toLocaleString();
            document.getElementById('stat-pending-orders').textContent = statsData.stats.pendingOrders;
        } else {
            // Show error state in stats
            document.getElementById('stat-total-orders').textContent = 'N/A';
            document.getElementById('stat-total-spent').textContent = 'N/A';
            document.getElementById('stat-pending-orders').textContent = 'N/A';
        }

        // Load Recent Orders (limit 5)
        const ordersData = await window.apiCall('get-orders?type=all&limit=5', 'GET');
        const tableBody = document.getElementById('recent-orders-table');
        
        if (ordersData && ordersData.success && ordersData.data.length > 0) {
            tableBody.innerHTML = ''; // Clear loading state
            ordersData.data.forEach(order => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        ${order['Order ID']}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${order.Service || order.Platform || `${order.From} to ${order.To}`}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${parseFloat(order.Total || order['Amount Sent']).toLocaleString()} Ks
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        ${getStatusBadge(order.Status)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        ${new Date(order.Timestamp).toLocaleDateString('en-US')}
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else if (ordersData && ordersData.data.length === 0) {
            // Show empty state
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-6 text-center text-gray-500">
                        <i class="fas fa-box-open mr-2"></i> No recent orders found.
                    </td>
                </tr>
            `;
        } else {
            // Show error state
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-6 text-center text-red-500">
                        <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load orders.
                    </td>
                </tr>
            `;
        }
    }

    // --- 7. Form Helpers ---
    
    /**
     * Gets a status badge HTML string
     * @param {string} status
     */
    window.getStatusBadge = (status) => {
        if (!status) return '';
        const statusClass = `status-${status.toLowerCase()}`;
        return `<span class="status-badge ${statusClass}">${status}</span>`;
    };

    /**
     * Sets the loading state for a form button
     * @param {HTMLButtonElement} button
     * @param {boolean} isLoading
     * @param {string} [originalText='Submit Order']
     */
    window.setLoading = (button, isLoading, originalText = 'Submit Order') => {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.classList.add('btn-disabled');
            button.innerHTML = `
                <i class="fas fa-spinner fa-spin mr-2"></i> Processing...
            `;
        } else {
            button.disabled = false;
            button.classList.remove('btn-disabled');
            button.innerHTML = originalText;
        }
    };
    
    /**
     * Validates a Myanmar phone number
     * @param {string} phone
     * @returns {boolean}
     */
    window.validateMyanmarPhone = (phone) => {
        const regex = /^(09|\+?959)\d{7,9}$/;
        return regex.test(phone);
    };

});
