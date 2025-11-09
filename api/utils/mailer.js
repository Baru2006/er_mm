// api/utils/mailer.js
// Nodemailer + Gmail OAuth2 with auto refresh using googleapis OAuth2Client
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const { GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

if (!GMAIL_USER || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  console.warn('Mailer warning: Gmail environment variables are not fully set. GMAIL_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN required.');
}

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // redirect - not used for refresh token flow
);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

async function createTransport() {
  const accessToken = await oAuth2Client.getAccessToken();
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: GMAIL_USER,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken?.token || accessToken
    }
  });
  return transport;
}

export async function sendMail(order) {
  const transporter = await createTransport();

  const html = buildOrderEmailHtml(order);

  const mailOptions = {
    from: `${GMAIL_USER}`,
    to: GMAIL_USER, // send to admin; modify to notify other emails if needed
    subject: `New Order: ${order.orderId} (${order.type})`,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

function buildOrderEmailHtml(o) {
  // Build friendly HTML email body
  const details = Object.entries(o).map(([k, v]) => `<tr><td style="padding:6px 8px;font-weight:600">${k}</td><td style="padding:6px 8px">${v}</td></tr>`).join('');
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
      <h2>New Order Received</h2>
      <table style="border-collapse:collapse;">
        ${details}
      </table>
      <p>Timestamp: ${new Date().toLocaleString()}</p>
      <p>-- Easy Recharge MM</p>
    </div>
  `;
}
