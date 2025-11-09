// price.js — export price configuration used by frontend pages
export const PRICES = {
  sim: { Customer: 1, Reseller: 0.95 },
  game: { Customer: 1, Reseller: 0.9 },
  smm: { Customer: 1, Reseller: 0.85 },
  p2p: { feePercent: 0.02 }
};
// Edit values to match your pricing model.
// The frontend multiplies package base amount by role multiplier.
