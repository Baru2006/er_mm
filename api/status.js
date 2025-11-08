import { getOrdersByUser } from './utils/sheets.js';

/**
 * Vercel serverless handler for GET /api/status?userId=...
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ success: false, error: 'Missing userId query parameter' });
  }

  try {
    // Fetch orders from all sheets
    const orders = await getOrdersByUser(userId);

    // Sort by timestamp descending (most recent first)
    orders.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
                 }
