// api/utils/sheets.js
// Google Sheets helper using googleapis JWT service account
import { google } from 'googleapis';

// Environment variables required:
// - GOOGLE_SHEET_ID
// - GOOGLE_CLIENT_EMAIL
// - GOOGLE_PRIVATE_KEY  (note: ensure newlines are properly stored; \"\\n\" converted)
// The service account must be granted edit access to the spreadsheet.

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

// If PRIVATE_KEY was stored with escaped newlines, unescape them
if (PRIVATE_KEY && PRIVATE_KEY.includes('\\n')) PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');

if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
  console.warn('Sheets helper is missing environment variables. GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY required.');
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
const sheets = google.sheets({ version: 'v4', auth });

// Map order types to sheet tabs
const TAB_MAP = {
  sim: 'Orders',
  game: 'Game_Orders',
  smm: 'SMM_Orders',
  p2p: 'P2P_Orders'
};

/**
 * appendOrder(type, payload)
 * - type: 'sim'|'game'|'smm'|'p2p'
 * - payload: object (order data). Will be flattened to a row.
 */
export async function appendOrder(type, payload) {
  const tab = TAB_MAP[type] || 'Orders';
  // Flatten object to a predictable row order
  // Recommended sheet columns: orderId,timestamp,status,userId,type,total,txId,details...
  const details = [];
  // push type-specific fields to details for visibility
  if (type === 'sim') details.push(payload.provider || '', payload.package || '', payload.userPhone || '');
  if (type === 'game') details.push(payload.game || '', payload.package || '', payload.gameId || '', payload.server || '');
  if (type === 'smm') details.push(payload.platform || '', payload.service || '', payload.targetUrl || '', payload.quantity || '');
  if (type === 'p2p') details.push(payload.amount || '', payload.from || '', payload.to || '', payload.fee || '', payload.receive || '');

  const row = [
    payload.orderId || '',
    payload.timestamp || '',
    payload.status || '',
    payload.userId || '',
    payload.type || type,
    payload.total || '',
    payload.txId || '',
    ...details
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] }
  });

  return true;
}

/**
 * getOrdersByUser(userId)
 * reads multiple tabs and returns combined array of orders for userId
 */
export async function getOrdersByUser(userId) {
  // We'll read each relevant tab's values and filter
  const tabs = Object.values(TAB_MAP);
  // batchGet to minimize requests
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges: tabs.map(t => `${t}!A1:Z1000`)
  });

  const valueRanges = res.data.valueRanges || [];
  const rows = [];

  valueRanges.forEach((vr, idx) => {
    const tab = tabs[idx];
    const values = vr.values || [];
    // Assume first row is headerless or header; we accept both — we search for userId in 4th column per appendOrder
    values.forEach((row) => {
      // protect against header rows or short rows
      if (row.length >= 4 && row[3] === userId) {
        // reconstruct object:
        rows.push({
          orderId: row[0] || '',
          timestamp: row[1] || '',
          status: row[2] || '',
          userId: row[3] || '',
          type: row[4] || tab,
          total: row[5] || '',
          txId: row[6] || '',
          extras: row.slice(7)
        });
      }
    });
  });

  // Sort newest first by timestamp if possible
  rows.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  return rows;
}
