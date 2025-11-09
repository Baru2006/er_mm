// api/order.js — Vercel serverless function
// POST /api/order
// Validates input, writes to Google Sheets via sheets.js, sends mail via mailer.js
import { json } from 'micro';
import cors from 'cors';
import initCors from 'micro-cors';
import { appendOrder } from './utils/sheets.js';
import { sendMail } from './utils/mailer.js';
import crypto from 'crypto';

const microCors = initCors({ allowMethods: ['POST', 'OPTIONS'] });
export default microCors(async (req, res) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = await json(req);
    // Basic validation
    if (!payload || !payload.type || !payload.userId) {
      return res.status(400).json({ error: 'Invalid payload: type and userId required' });
    }

    // Attach server-side order Id & timestamp & status
    const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex');
    const timestamp = new Date().toISOString();
    const status = 'Pending';

    const orderRow = {
      orderId,
      timestamp,
      status,
      ...payload
    };

    // Append to sheet (sheets.js will route to the correct tab)
    await appendOrder(payload.type, orderRow);

    // Send notification email (async, but await to surface errors)
    try {
      await sendMail(orderRow);
    } catch (mailErr) {
      console.error('Mail error', mailErr);
      // proceed — still respond OK, but include warning
      return res.status(200).json({ ok: true, orderId, warning: 'Order created but email failed' });
    }

    return res.status(200).json({ ok: true, orderId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
});
