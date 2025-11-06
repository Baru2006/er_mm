/* price.js - Central price object for Easy Recharge MM
   Defines base (Customer) and Reseller pricing tiers.
   Adjust values as needed for your business logic.
*/

const PRICES = {
  Customer: {
    sim: {
      // base multiplier or base values used in forms (some forms use explicit base numbers)
      discount: 0, // no discount
    },
    game: {
      discount: 0
    },
    smm: {
      discount: 0
    },
    p2p: {
      feePercent: 0.02
    },
    genericMultiplier: 1.0
  },
  Reseller: {
    sim: {
      discount: 0.20 // 20% off
    },
    game: {
      discount: 0.18
    },
    smm: {
      discount: 0.25
    },
    p2p: {
      feePercent: 0.015
    },
    genericMultiplier: 0.80
  }
};

/* Example usage:
   calculateRolePrice('sim', basePrice, 'Reseller') -> price after discount
*/
