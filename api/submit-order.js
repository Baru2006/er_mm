// Vercel Serverless Function: api/submit-order.js
// Handles all new order submissions (SIM, Game, SMM, P2P)
// and saves them to Google Sheets.

const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Helper function to initialize Google Spreadsheet
async function initDoc() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
  } catch (e) {
    console.error('Error loading spreadsheet:', e.message);
    throw new Error('Could not initialize database connection.');
  }
}

// Helper function to generate a unique order ID
function generateOrderID(type) {
  const prefix = String(type).toUpperCase().substring(0, 4);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
}

export default async function handler(req, res) {
  // Allow OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  // Set CORS headers for the actual request
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { orderType, ...data } = req.body;
    const userId = req.headers['x-user-id'] || data.userId || 'guest'; // Get user ID from header or body
    const timestamp = new Date().toISOString();
    const orderId = generateOrderID(orderType);
    const status = 'Pending'; // Default status

    if (!orderType || !data) {
      return res.status(400).json({ error: 'Missing orderType or order data.' });
    }

    const doc = await initDoc();
    let sheet;
    let newRow;

    // Determine which sheet to write to based on orderType
    switch (orderType) {
      case 'sim':
      case 'game':
        sheet = doc.sheetsByTitle['Orders'];
        if (!sheet) throw new Error('Sheet "Orders" not found.');
        newRow = {
          Timestamp: timestamp,
          'Order ID': orderId,
          'User ID': userId,
          Service: data.service || `${orderType}: ${data.package}`,
          Target: data.targetNumber || data.gameId,
          Quantity: data.quantity || 1,
          Total: data.totalAmount,
          Payment: data.paymentMethod,
          'Transaction ID': data.transactionId,
          Status: status,
        };
        break;

      case 'smm':
        sheet = doc.sheetsByTitle['SMM_Orders'];
        if (!sheet) throw new Error('Sheet "SMM_Orders" not found.');
        newRow = {
          Timestamp: timestamp,
          'Order ID': orderId,
          'User ID': userId,
          Platform: data.platform,
          Service: data.service,
          Link: data.link,
          Quantity: data.quantity,
          Total: data.totalAmount,
          Payment: data.paymentMethod,
          'Transaction ID': data.transactionId,
          Status: status,
        };
        break;

      case 'p2p':
        sheet = doc.sheetsByTitle['P2P'];
        if (!sheet) throw new Error('Sheet "P2P" not found.');
        newRow = {
          Timestamp: timestamp,
          'Order ID': orderId,
          'User ID': userId,
          From: data.fromMethod,
          To: data.toMethod,
          'Amount Sent': data.amountSent,
          Fee: data.fee,
          'Amount Receive': data.amountReceive,
          'Account Details': data.accountDetails,
          'Transaction ID': data.transactionId,
          Status: status,
        };
        break;

      default:
        return res.status(400).json({ error: 'Invalid orderType.' });
    }

    // Add the new row to the determined sheet
    await sheet.addRow(newRow);

    return res.status(200).json({
      success: true,
      message: 'Order submitted successfully.',
      orderId: orderId,
      status: status,
    });
  } catch (error) {
    console.error('Error in submit-order:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
