// Vercel Serverless Function: api/get-stats.js
// Calculates and returns dashboard statistics for a specific user.
// (Total Orders, Total Spent, Pending Orders)

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

// Helper to get all rows for a user from a sheet
async function getUserRows(sheet, userId) {
  if (!sheet) return [];
  const rows = await sheet.getRows();
  return rows
    .filter(row => row.get('User ID') === userId)
    .map(row => row.toObject());
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. User ID (x-user-id) header is required.' });
    }

    const doc = await initDoc();
    const sheetsToFetch = ['Orders', 'SMM_Orders', 'P2P'];
    let allUserOrders = [];

    // Fetch rows from all relevant sheets
    for (const sheetName of sheetsToFetch) {
      const sheet = doc.sheetsByTitle[sheetName];
      allUserOrders.push(...(await getUserRows(sheet, userId)));
    }

    let totalOrders = 0;
    let totalSpent = 0;
    let pendingOrders = 0;

    allUserOrders.forEach(order => {
      totalOrders++;

      if (order.Status && order.Status.toLowerCase() === 'pending') {
        pendingOrders++;
      }

      // Calculate total spent
      // Note: 'Total' is for Orders/SMM, 'Amount Sent' is for P2P
      let amount = 0;
      if (order.Total) {
        amount = parseFloat(String(order.Total).replace(/,/g, ''));
      } else if (order['Amount Sent']) {
        amount = parseFloat(String(order['Amount Sent']).replace(/,/g, ''));
      }
      
      if (!isNaN(amount)) {
        totalSpent += amount;
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalOrders,
        totalSpent: totalSpent.toFixed(2), // Format as currency
        pendingOrders,
      },
    });
  } catch (error) {
    console.error('Error in get-stats:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
      }
