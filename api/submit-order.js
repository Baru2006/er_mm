const { google } = require('googleapis');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('📦 Received order:', body);

    const result = await processOrder(body);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      status: 'error', 
      data: { message: error.message }
    });
  }
};

async function processOrder(data) {
  const sheets = await getSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  
  const orderId = generateOrderId(data.action.replace('submit', ''));
  const timestamp = new Date().toISOString();
  
  let rowData;
  let sheetName;
  
  switch(data.action) {
    case 'submitSim':
      sheetName = 'Orders';
      rowData = [
        timestamp, orderId, data.userId, data.service, 
        data.phone, 1, parseFloat(data.total), data.payment, data.txid, 'Pending'
      ];
      break;
    case 'submitGame':
      sheetName = 'Orders';
      rowData = [
        timestamp, orderId, data.userId, data.service, 
        data.gameId, parseInt(data.quantity), parseFloat(data.total), 
        data.payment, data.txid, 'Pending'
      ];
      break;
    case 'submitSmm':
      sheetName = 'SMM_Orders';
      rowData = [
        timestamp, orderId, data.userId, data.platform, data.service,
        data.link, parseInt(data.quantity), parseFloat(data.total), 
        data.payment, data.txid, 'Pending'
      ];
      break;
    case 'submitP2P':
      sheetName = 'P2P';
      rowData = [
        timestamp, orderId, data.userId, data.from, data.to,
        parseFloat(data.amountSent), parseFloat(data.fee), 
        parseFloat(data.amountReceive), data.accountDetails, data.txid, 'Pending'
      ];
      break;
    default:
      throw new Error('Invalid action: ' + data.action);
  }
  
  // Create sheet if not exists and add headers
  await ensureSheetExists(sheets, sheetId, sheetName);
  
  // Append the order data
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    resource: { values: [rowData] }
  });
  
  console.log(`✅ Order ${orderId} saved to sheet ${sheetName}`);
  
  return { 
    orderId: orderId, 
    status: 'Pending' 
  };
}

async function ensureSheetExists(sheets, sheetId, sheetName) {
  try {
    // Try to get the sheet
    await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:Z1`
    });
  } catch (error) {
    // Sheet doesn't exist, create it with headers
    console.log(`📄 Creating new sheet: ${sheetName}`);
    
    const headers = getHeadersForSheet(sheetName);
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      resource: { values: [headers] }
    });
  }
}

function getHeadersForSheet(sheetName) {
  const headers = {
    'Orders': ['Timestamp', 'Order ID', 'User ID', 'Service', 'Target', 'Quantity', 'Total', 'Payment', 'Transaction ID', 'Status'],
    'P2P': ['Timestamp', 'Order ID', 'User ID', 'From', 'To', 'Amount Sent', 'Fee', 'Amount Receive', 'Account Details', 'Transaction ID', 'Status'],
    'SMM_Orders': ['Timestamp', 'Order ID', 'User ID', 'Platform', 'Service', 'Link', 'Quantity', 'Total', 'Payment', 'Transaction ID', 'Status']
  };
  
  return headers[sheetName] || ['Timestamp', 'Order ID', 'User ID', 'Data', 'Status'];
}

function generateOrderId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
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
