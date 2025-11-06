const basePrices = {
  'Data 1GB': 1000,
  'Data 3GB': 2500,
  'Data 5GB': 4000,
  'PUBG': 2000,
  'Mobile Legends': 1500,
  'Free Fire': 1200,
  'SMM': 100
};

function getPrice(item, role='Customer', qty=1) {
  let price = basePrices[item] || 0;
  if(role === 'Reseller') price *= 0.85;
  return price * qty;
}
