import { appendOrder } from './utils/sheets.js';
import { sendMail } from './utils/mailer.js';

/**
 * Vercel serverless handler for POST /api/order
 */
export default async function handler(req, res) {
  // CORS header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    if (!payload || !payload.type) {
      return res.status(400).json({ success: false, error: 'Missing payload or type' });
    }

    const { type } = payload;
    const validTypes = ['sim', 'game', 'smm', 'p2p'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid type' });
    }

    // Validate essential fields
    switch (type) {
      case 'sim':
        if (!payload.Phone || !payload.Package || !payload.Provider) {
          return res.status(400).json({ success: false, error: 'Missing required SIM fields' });
        }
        break;
      case 'game':
        if (!payload.GameID || !payload.Game || !payload.Package) {
          return res.status(400).json({ success: false, error: 'Missing required Game fields' });
        }
        break;
      case 'smm':
        if (!payload.Target || !payload.Service || !payload.Quantity) {
          return res.status(400).json({ success: false, error: 'Missing required SMM fields' });
        }
        if (payload.Quantity < 25 || payload.Quantity > 100000) {
          return res.status(400).json({ success: false, error: 'Quantity out of bounds (25–100000)' });
        }
        break;
      case 'p2p':
        if (!payload.Amount || !payload.From || !payload.To || !payload.txnId) {
          return res.status(400).json({ success: false, error: 'Missing required P2P fields' });
        }
        if (payload.From === payload.To) {
          return res.status(400).json({ success: false, error: 'From and To cannot be the same' });
        }
        break;
    }

    // Generate OrderID if not provided
    if (!payload.OrderID) {
      const suffix = Date.now().toString().slice(-6);
      payload.OrderID = `ORD-${suffix}`;
    }

    // Timestamp
    payload.Timestamp = new Date().toISOString();

    // Append to Google Sheets
    await appendOrder(type, payload);

    // Send email notification
    let emailSent = true;
    try {
      await sendMail(payload);
    } catch (e) {
      console.error('Email send failed:', e);
      emailSent = false;
    }

    return res.status(200).json({ success: true, orderId: payload.OrderID, emailSent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
        }
