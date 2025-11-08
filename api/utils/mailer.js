import nodemailer from "nodemailer";
import { google } from "googleapis";

// ✅ Environment Variables (Vercel / .env)
const {
  GMAIL_USER,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

// ✅ Setup OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// ✅ Send Mail Function
export async function sendMail(order) {
  try {
    // Get new access token automatically
    const { token } = await oAuth2Client.getAccessToken();

    // Setup Nodemailer transporter (Gmail OAuth2)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: GMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: token,
      },
    });

    // Compose email content
    const mailOptions = {
      from: `"Easy Recharge MM" <${GMAIL_USER}>`,
      to: GMAIL_USER, // You can change to admin email
      subject: `📲 New ${order.type?.toUpperCase()} Order - ${order.OrderID || "N/A"}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>Easy Recharge MM - New Order</h2>
          <p><b>Order ID:</b> ${order.OrderID || "(auto)"}</p>
          <p><b>User ID:</b> ${order.UserID}</p>
          <p><b>Type:</b> ${order.type}</p>
          <p><b>Total:</b> ${order.Total || order.amount}</p>
          <p><b>Transaction ID:</b> ${order.transactionId || "N/A"}</p>
          <p><b>Timestamp:</b> ${new Date().toLocaleString("en-US", {
            timeZone: "Asia/Yangon",
          })}</p>
          <hr />
          <p>This is an automated notification from Easy Recharge MM backend.</p>
        </div>
      `,
    };

    // Send the email
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", result.messageId);

    return { success: true, emailSent: true };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, emailSent: false, error: error.message };
  }
      }
