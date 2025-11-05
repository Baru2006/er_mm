const SERVICE_PRICES = {
  // key: { name, price, description }
  sim: {
    'mpt-3gb': { name: 'MPT 3GB', price: 1500, desc: '3GB Data for 30 days' },
    'mpt-5gb': { name: 'MPT 5GB', price: 2500, desc: '5GB Data for 30 days' },
    'telenor-regular': { name: 'Telenor Regular 1000', price: 1000, desc: '1000 Ks Regular Bill' },
    'ooredoo-basic': { name: 'Ooredoo Basic 2000', price: 2000, desc: '2000 Ks Basic Bill' }
  },
  game: {
    'freefire-100': { name: '100 Diamonds', price: 3000, desc: '100 FF Diamonds' },
    'pubg-60': { name: '60 UC', price: 2000, desc: '60 PUBG UC' },
    'mlbb-86': { name: '86 Diamonds', price: 2500, desc: '86 MLBB Diamonds' }
  },
  smm: {
    'fb-likes': { name: 'Facebook Page Likes', price: 2000, desc: 'Price per 1000 likes' },
    'ig-followers': { name: 'Instagram Followers', price: 4000, desc: 'Price per 1000 followers' },
    'yt-subscribers': { name: 'YouTube Subscribers', price: 8000, desc: 'Price per 1000 subscribers' }
  }
};

const P2P_FEE_RATE = 0.02; // 2% fee
