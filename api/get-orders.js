const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId, filter = 'all', limit } = req.query;
    console.log('📋 Getting orders for:', userId, filter, limit);

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        data: { message: 'User ID is required' }
      });
    }

    const orders = await getOrders(userId, filter, limit);
    
    res.json({ 
      status: 'success', 
      data: orders 
    });
  } catch (error) {
    console.error('❌ Get orders error:', error);
    res.status(500).json({ 
      status: 'error', 
      data: { message: error.message } 
    });
  }
};

async function getOrders(userId, filter, limit) {
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  const allOrders = [];
  const sheetsToCheck = ['Orders', 'P2P', 'SMM_Orders'];

  for (const sheetName of sheetsToCheck) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length < 2) continue;

      const headers = rows[0];
      const userIdCol = headers.indexOf('User ID');
      
      if (userIdCol === -1) continue;

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][userIdCol] == userId) {
          const order = mapOrder(rows[i], headers, sheetName);
          if (filter === 'all' || order.type === filter) {
            allOrders.push(order);
          }
        }
      }
    } catch (error) {
      console.log(`📄 Sheet ${sheetName} not found or error:`, error.message);
    }
  }

  // Sort by timestamp (newest first)
  allOrders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply limit
  const result = limit ? allOrders.slice(0, parseInt(limit)) : allOrders;
  console.log(`✅ Found ${result.length} orders for user ${userId}`);
  
  return result;
}

function mapOrder(row, headers, sheetName) {
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
    payment: getValue('Payment'),
    txid: getValue('Transaction ID')
  };

  switch (sheetName) {
    case 'Orders':
      return {
        ...baseOrder,
        service: getValue('Service'),
        target: getValue('Target'),
        quantity: parseInt(getValue('Quantity')) || 1,
        type: 'orders'
      };
    case 'P2P':
      return {
        ...baseOrder,
        service: 'P2P Exchange',
        target: getValue('Account Details'),
        quantity: 1,
        type: 'p2p'
      };
    case 'SMM_Orders':
      return {
        ...baseOrder,
        service: getValue('Service'),
        target: getValue('Link'),
        quantity: parseInt(getValue('Quantity')) || 1,
        type: 'smm'
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
