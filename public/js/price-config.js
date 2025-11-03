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
