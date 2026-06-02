process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Brevo = require("sib-api-v3-sdk");

const client = Brevo.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

const sendMail = async ({ to, subject, html }) => {
  const response = await apiInstance.sendTransacEmail({
    sender: { email: process.env.EMAIL_USER, name: "HMS System" },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });
  return response;
};

module.exports = sendMail;