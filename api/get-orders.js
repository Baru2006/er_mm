// Vercel Serverless Function: api/get-orders.js
// Fetches orders for a specific user.
// Supports filtering by order type (all, p2p, smm, orders) and pagination.

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

// Helper to fetch and format rows from a sheet
async function fetchOrdersFromSheet(sheet, userId) {
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
    const { type = 'all', limit = 20, page = 1 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. User ID (x-user-id) header is required.' });
    }

    const doc = await initDoc();
    let orders = [];

    // Fetch data based on the 'type' query parameter
    if (type === 'all' || type === 'orders') {
      const sheet = doc.sheetsByTitle['Orders'];
      orders.push(...(await fetchOrdersFromSheet(sheet, userId)));
    }
    if (type === 'all' || type === 'smm') {
      const sheet = doc.sheetsByTitle['SMM_Orders'];
      orders.push(...(await fetchOrdersFromSheet(sheet, userId)));
    }
    if (type === 'all' || type === 'p2p') {
      const sheet = doc.sheetsByTitle['P2P'];
      orders.push(...(await fetchOrdersFromSheet(sheet, userId)));
    }

    // Sort all fetched orders by Timestamp (newest first)
    // Note: Firestore's 'orderBy' is not available here, so we sort in memory.
    orders.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

    // Apply pagination
    const totalOrders = orders.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedOrders = orders.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      data: paginatedOrders,
      pagination: {
        total: totalOrders,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalOrders / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error in get-orders:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
