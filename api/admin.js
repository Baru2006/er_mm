const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminData = await getAdminData();
    
    res.json({ 
      status: 'success', 
      data: adminData 
    });
  } catch (error) {
    console.error('❌ Admin API error:', error);
    res.status(500).json({ 
      status: 'error', 
      data: { message: error.message } 
    });
  }
};

async function getAdminData() {
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  const allOrders = [];
  const sheetsToCheck = [
    { name: 'Orders', type: 'orders' },
    { name: 'P2P', type: 'p2p' },
    { name: 'SMM_Orders', type: 'smm' }
  ];

  for (const sheet of sheetsToCheck) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheet.name}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length < 2) continue;

      const headers = rows[0];
      console.log(`📄 Processing ${rows.length - 1} orders from ${sheet.name}`);

      for (let i = 1; i < rows.length; i++) {
        const order = mapAdminOrder(rows[i], headers, sheet.name, sheet.type);
        allOrders.push(order);
      }
    } catch (error) {
      console.log(`📄 Sheet ${sheet.name} not found for admin:`, error.message);
    }
  }

  // Sort by timestamp (newest first)
  allOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log(`👑 Admin data: ${allOrders.length} total orders`);
  return { orders: allOrders };
}

function mapAdminOrder(row, headers, sheetName, type) {
  const getValue = (field) => {
    const index = headers.indexOf(field);
    return index !== -1 ? row[index] : null;
  };

  const baseOrder = {
    orderId: getValue('Order ID'),
    userId: getValue('User ID'),
    total: parseFloat(getValue('Total')) || 0,
    status: getValue('Status') || 'Pending',
    timestamp: getValue('Timestamp'),
    txid: getValue('Transaction ID'),
    sheetName: sheetName,
    type: type
  };

  switch (sheetName) {
    case 'Orders':
      return {
        ...baseOrder,
        service: getValue('Service'),
        target: getValue('Target'),
        quantity: parseInt(getValue('Quantity')) || 1
      };
    case 'P2P':
      return {
        ...baseOrder,
        service: 'P2P Exchange',
        target: getValue('Account Details'),
        quantity: 1
      };
    case 'SMM_Orders':
      return {
        ...baseOrder,
        service: getValue('Service'),
        target: getValue('Link'),
        quantity: parseInt(getValue('Quantity')) || 1
      };
    default:
      return baseOrder;
  }
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.private_key.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  
  return google.sheets({ version: 'v4', auth });
        }
