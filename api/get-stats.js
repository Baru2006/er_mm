const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId } = req.query;
    console.log('📊 Getting stats for:', userId);

    if (!userId) {
      return res.status(400).json({
        status: 'error',
        data: { message: 'User ID is required' }
      });
    }

    const stats = await getStats(userId);
    
    res.json({ 
      status: 'success', 
      data: stats 
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({ 
      status: 'error', 
      data: { message: error.message } 
    });
  }
};

async function getStats(userId) {
  const orders = await getOrders(userId);
  
  let totalOrders = orders.length;
  let totalSpent = 0;
  let pendingOrders = 0;

  orders.forEach(order => {
    totalSpent += order.total;
    if (order.status && order.status.toLowerCase() === 'pending') {
      pendingOrders++;
    }
  });

  const stats = {
    totalOrders,
    totalSpent: Math.round(totalSpent * 100) / 100,
    pendingOrders
  };

  console.log(`📊 Stats for ${userId}:`, stats);
  return stats;
}

async function getOrders(userId) {
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
          const order = {
            total: parseFloat(rows[i][headers.indexOf('Total')]) || 0,
            status: rows[i][headers.indexOf('Status')] || 'Pending'
          };
          allOrders.push(order);
        }
      }
    } catch (error) {
      console.log(`📄 Sheet ${sheetName} not found for stats:`, error.message);
    }
  }

  return allOrders;
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.private_key, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  
  return google.sheets({ version: 'v4', auth });
    }
