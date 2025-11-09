// api/status.js — Vercel serverless function
// GET /api/status?userId=...
import initCors from 'micro-cors';
import { getOrdersByUser } from './utils/sheets.js';

const cors = initCors({ allowMethods: ['GET', 'OPTIONS'] });

export default cors(async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = req.query?.userId || (req.url && new URL(req.url, 'http://localhost').searchParams.get('userId'));
  if (!userId) return res.status(400).json({ error: 'userId query param required' });

  try {
    const rows = await getOrdersByUser(userId);
    // rows should be array of objects: {orderId,type,total,status,txId,timestamp,...}
    return res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
