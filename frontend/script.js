/* ================================
   Easy Recharge MM - Frontend Script
   ================================ */

// Replace with your deployed backend URL
export const API_ROOT = 'https://easyrechargemm.vercel.app/';

/**
 * Initialize UserID and Role in localStorage
 */
export function initUser() {
  if (!localStorage.getItem('ERMM_UserID')) {
    localStorage.setItem('ERMM_UserID', 'USER-' + Date.now());
  }
  if (!localStorage.getItem('ERMM_Role')) {
    localStorage.setItem('ERMM_Role', 'Customer');
  }
  document.getElementById('user-id')?.textContent = localStorage.getItem('ERMM_UserID');
  document.getElementById('user-role')?.textContent = localStorage.getItem('ERMM_Role');
}

/**
 * Copy admin phone to clipboard
 */
export function copyAdminPhone() {
  const phoneInput = document.getElementById('adminPhone');
  if (!phoneInput) return;
  navigator.clipboard.writeText(phoneInput.value).then(() => {
    alert('Admin phone copied: ' + phoneInput.value);
  });
}

/**
 * Send order payload to backend
 * @param {object} payload
 */
export async function sendOrder(payload) {
  try {
    const res = await fetch(`${API_ROOT}/api/order`, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Failed to send order.' };
  }
}

/**
 * Send P2P payment payload
 * @param {object} payload
 */
export async function sendPayment(payload) {
  // For simplicity, reuse sendOrder endpoint with type='p2p'
  payload.type = 'p2p';
  return sendOrder(payload);
}

/**
 * Fetch orders for current user
 */
export async function getOrders() {
  const userId = localStorage.getItem('ERMM_UserID');
  if (!userId) return;

  try {
    const res = await fetch(`${API_ROOT}/api/status?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      mode: 'cors'
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
    return { success: false, orders: [] };
  }
}

/**
 * Price calculation helpers
 * Uses imported calcRolePrice from price.js
 */
import { calcRolePrice } from './price.js';

/**
 * Example: update total on quantity/input change
 * @param {string} type - 'sim' | 'game' | 'smm' | 'p2p'
 * @param {number} baseTotal
 * @param {string} totalInputId
 */
export function updateTotal(type, baseTotal, totalInputId) {
  const role = localStorage.getItem('ERMM_Role') || 'Customer';
  const final = calcRolePrice(type, baseTotal, role);
  const totalInput = document.getElementById(totalInputId);
  if (totalInput) totalInput.value = final.toFixed(0) + ' Ks';
}

/**
 * Utility: format timestamp to local string
 */
export function formatDate(timestamp) {
  if (!timestamp) return '-';
  const d = new Date(timestamp);
  return d.toLocaleString('en-GB', { timeZone: 'Asia/Yangon' });
}
