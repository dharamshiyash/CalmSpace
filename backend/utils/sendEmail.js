const nodemailer = require("nodemailer");

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = { from, to, subject, text, html };
  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendEmail };


