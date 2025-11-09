// price.js - service pricing and p2p fee
const SERVICE_PRICES = {
  sim: {'mpt-3gb':1500,'mpt-5gb':2500,'telenor-regular':1000,'ooredoo-basic':2000},
  game: {'freefire-100':3000,'pubg-60':2000,'mlbb-86':2500},
  smm: {'fb-likes':2000,'ig-followers':4000,'yt-subscribers':8000},
  p2p: {feePercent:0.03}
};

const RESELLER_DISCOUNT = 0.05; // 10% off for resellers
