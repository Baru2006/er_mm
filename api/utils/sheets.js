import { google } from 'googleapis';

// Load env variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  throw new Error('Missing Google Sheets environment variables!');
}

// JWT auth
const auth = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Sheet tabs
const SHEETS = {
  sim: 'Orders',
  game: 'Game_Orders',
  smm: 'SMM_Orders',
  p2p: 'P2P_Orders'
};

/**
 * Append order to the correct sheet
 * @param {string} type - sim | game | smm | p2p
 * @param {object} payload - order data
 */
export async function appendOrder(type, payload) {
  const sheetName = SHEETS[type];
  if (!sheetName) throw new Error('Invalid type: ' + type);

  // Map payload fields to row depending on type
  let row = [];
  switch (type) {
    case 'sim':
      row = [
        payload.OrderID,
        payload.UserID || '',
        payload.Provider || '',
        payload.Package || '',
        payload.Phone || '',
        payload.Total || '',
        payload.txnId || '',
        payload.Timestamp || ''
      ];
      break;
    case 'game':
      row = [
        payload.OrderID,
        payload.UserID || '',
        payload.Game || '',
        payload.Package || '',
        payload.GameID || '',
        payload.Server || '',
        payload.Total || '',
        payload.txnId || '',
        payload.Timestamp || ''
      ];
      break;
    case 'smm':
      row = [
        payload.OrderID,
        payload.UserID || '',
        payload.Platform || '',
        payload.Service || '',
        payload.Target || '',
        payload.Quantity || '',
        payload.Total || '',
        payload.txnId || '',
        payload.Timestamp || ''
      ];
      break;
    case 'p2p':
      row = [
        payload.OrderID,
        payload.UserID || '',
        payload.Amount || '',
        payload.From || '',
        payload.To || '',
        payload.Receive || '',
        payload.Fee || '',
        payload.txnId || '',
        payload.Timestamp || ''
      ];
      break;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] }
  });
}

/**
 * Fetch all orders for a given userId
 * @param {string} userId
 * @returns {Promise<Array>} combined orders array
 */
export async function getOrdersByUser(userId) {
  const allOrders = [];

  for (const type in SHEETS) {
    const sheetName = SHEETS[type];

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: sheetName
    });

    const values = res.data.values || [];

    // Skip header row
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      // Map row depending on type
      let order = { type };
      switch (type) {
        case 'sim':
          order = {
            ...order,
            OrderID: row[0],
            UserID: row[1],
            Provider: row[2],
            Package: row[3],
            Phone: row[4],
            Total: row[5],
            txnId: row[6],
            Timestamp: row[7]
          };
          break;
        case 'game':
          order = {
            ...order,
            OrderID: row[0],
            UserID: row[1],
            Game: row[2],
            Package: row[3],
            GameID: row[4],
            Server: row[5],
            Total: row[6],
            txnId: row[7],
            Timestamp: row[8]
          };
          break;
        case 'smm':
          order = {
            ...order,
            OrderID: row[0],
            UserID: row[1],
            Platform: row[2],
            Service: row[3],
            Target: row[4],
            Quantity: row[5],
            Total: row[6],
            txnId: row[7],
            Timestamp: row[8]
          };
          break;
        case 'p2p':
          order = {
            ...order,
            OrderID: row[0],
            UserID: row[1],
            Amount: row[2],
            From: row[3],
            To: row[4],
            Receive: row[5],
            Fee: row[6],
            txnId: row[7],
            Timestamp: row[8]
          };
          break;
      }

      if (order.UserID === userId) allOrders.push(order);
    }
  }

  return allOrders;
  }
