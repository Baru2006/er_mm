/**
 * Easy Recharge MM - Service Pricing Data
 * This file stores all client-side prices.
 * Prices here MUST match the logic in script.js for dropdowns.
 */
const SERVICE_PRICES = {
  // SIM Prices
  sim: {
    'mpt-3gb': { name: 'MPT 3GB', price: 1500 },
    'mpt-5gb': { name: 'MPT 5GB', price: 2500 },
    'telenor-regular': { name: 'Telenor Regular 1000', price: 1000 },
    'ooredoo-basic': { name: 'Ooredoo Basic 2000', price: 2000 },
    'mytel-1gb': { name: 'MyTel 1GB', price: 900 }
  },
  // Game Prices
  game: {
    'freefire-100': { name: 'FreeFire 100 Diamonds', price: 3000 },
    'pubg-60': { name: 'PUBG 60 UC', price: 2000 },
    'mlbb-86': { name: 'MLBB 86 Diamonds', price: 2500 },
    'codm-80': { name: 'CoDM 80 CP', price: 1500 }
  },
  // SMM Prices (per 1000)
  smm: {
    'fb-likes': { name: 'Facebook Page Likes (per 1000)', price: 2000 },
    'ig-followers': { name:CSS: 'Instagram Followers (per 1000)', price: 4000 },
    'yt-subscribers': { name: 'YouTube Subscribers (per 1000)', price: 8000 },
    'tk-views': { name: 'TikTok Views (per 1000)', price: 1000 }
  },
  // P2P Fee
  p2p: {
    feePercent: 0.02 // 2%
  }
};

// Discount for Resellers
const RESELLER_DISCOUNT_PERCENT = 0.05; // 5%

// Mapping for dynamic dropdowns
const DROPDOWN_MAP = {
  sim: {
    mpt: ['mpt-3gb', 'mpt-5gb'],
    telenor: ['telenor-regular'],
    ooredoo: ['ooredoo-basic'],
    mytel: ['mytel-1gb']
  },
  game: {
    freefire: ['freefire-100'],
    pubg: ['pubg-60'],
    mlbb: ['mlbb-86'],
    codm: ['codm-80']
  },
  smm: {
    fb: ['fb-likes'],
    ig: ['ig-followers'],
    yt: ['yt-subscribers'],
    tk: ['tk-views']
  }
};

