/* ================================
   Easy Recharge MM - Price Configuration
   ================================ */

/**
 * PRICES object defines base price for each service type
 * and optional reseller discount.
 * All prices are in MMK (Kyat)
 */
export const PRICES = {
  sim: {
    base: { MPT: 1000, Ooredoo: 1000, Telenor: 1000, MyTel: 1000 },
    resellerDiscount: 0.9  // 10% off for Reseller
  },
  game: {
    base: { 'Free Fire': 2000, 'MLBB': 1500, 'PUBG': 2500, 'Ragnarok': 1800 },
    resellerDiscount: 0.85  // 15% off for Reseller
  },
  smm: {
    // SMM services are priced per 1k units
    base: {},  // Actual prices defined in order_smm.html SMM_SERVICES
    resellerDiscount: 0.9
  },
  p2p: {
    feePercent: 0.02  // 2% fee deducted from total
  }
};

/**
 * Calculate final price based on role
 * @param {string} type - 'sim' | 'game' | 'smm' | 'p2p'
 * @param {number} basePrice - calculated base total
 * @param {string} role - 'Customer' | 'Reseller'
 * @returns {number} final price in MMK
 */
export function calcRolePrice(type, basePrice, role) {
  if (!type || !basePrice) return 0;
  if (role === 'Reseller') {
    if (type === 'p2p') return basePrice * (1 - PRICES.p2p.feePercent);
    return basePrice * (PRICES[type]?.resellerDiscount || 1);
  }
  // Customer
  if (type === 'p2p') return basePrice * (1 - PRICES.p2p.feePercent);
  return basePrice; // no discount for Customer
}
