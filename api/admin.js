// Vercel Serverless Function: api/admin.js
// Admin-only endpoint.
// GET: Fetches all orders from all sheets for the admin panel.
// POST: Updates the status of a specific order.

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

// Admin Authentication (Basic Check)
// In a real app, use a proper auth system (e.g., JWT, OAuth)
function isAdmin(req) {
  const adminEmail = req.headers['x-admin-email']; // Simple check
  return adminEmail === process.env.ADMIN_EMAIL;
}

// Helper to fetch all rows from a sheet
async function fetchAllRows(sheet, sheetName) {
  if (!sheet) return [];
  const rows = await sheet.getRows();
  return rows.map(row => ({ ...row.toObject(), _sheetName: sheetName, _rowNumber: row.rowNumber }));
}

// GET handler: Fetch all orders
async function handleGet(req, res, doc) {
  const sheetsToFetch = [
    { name: 'Orders', title: doc.sheetsByTitle['Orders'] },
    { name: 'SMM_Orders', title: doc.sheetsByTitle['SMM_Orders'] },
    { name: 'P2P', title: doc.sheetsByTitle['P2P'] },
  ];
  
  let allOrders = [];

  for (const sheet of sheetsToFetch) {
    allOrders.push(...(await fetchAllRows(sheet.title, sheet.name)));
  }
  
  // Sort all fetched orders by Timestamp (newest first)
  allOrders.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

  return res.status(200).json({ success: true, data: allOrders });
}

// POST handler: Update order status
async function handlePost(req, res, doc) {
  const { orderId, newStatus, sheetName } = req.body;

  if (!orderId || !newStatus || !sheetName) {
    return res.status(400).json({ error: 'Missing orderId, newStatus, or sheetName.' });
  }

  const sheet = doc.sheetsByTitle[sheetName];
  if (!sheet) {
    return res.status(404).json({ error: `Sheet "${sheetName}" not found.` });
  }

  try {
    const rows = await sheet.getRows();
    const orderRow = rows.find(row => row.get('Order ID') === orderId);

    if (!orderRow) {
      return res.status(404).json({ error: `Order ID "${orderId}" not found in sheet "${sheetName}".` });
    }

    // Update the status
    orderRow.set('Status', newStatus);
    await orderRow.save(); // Save the change back to Google Sheets

    return res.status(200).json({
      success: true,
      message: `Order ${orderId} status updated to ${newStatus}.`,
    });
  } catch (e) {
    console.error('Error updating row:', e.message);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}


export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-Admin-Email');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Admin Authentication ---
  // A real app should use a secure token-based auth.
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
  
  try {
    const doc = await initDoc();

    if (req.method === 'GET') {
      return await handleGet(req, res, doc);
    }

    if (req.method === 'POST') {
      return await handlePost(req, res, doc);
    }

    // Handle other methods
    return res.status(405).json({ error: `Method ${req.method} Not Allowed.` });

  } catch (error) {
    console.error('Error in admin handler:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}
