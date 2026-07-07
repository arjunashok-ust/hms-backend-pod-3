/**
 * @file sendMail.js
 * @description
 * This file provides a utility function for sending transactional emails using the Brevo (formerly Sendinblue) API.
 *
 * @overview
 * This module configures the Brevo SDK with an API key from environment variables.
 * It exports a single asynchronous function, `sendMail`, which takes a recipient, subject, and HTML content.
 * It constructs and dispatches a transactional email, handling success and error logging.
 *
 * Connections:
 *   [authController, patientController, verifyEmailController] -> SENDMAIL.JS -> Brevo API
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Brevo = require("sib-api-v3-sdk");
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new Brevo.TransactionalEmailsApi();

const sendMail = async ({ to, subject, htmlContent }) => {
  if (!to || !subject || !htmlContent) {
    throw new Error(
      "sendMail verification failed: Missing required parameters.",
    );
  }

  try {
    const response = await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "HMS System",
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    console.log(`Email successfully dispatched to: ${to}`);
    return response;
  } catch (err) {
    console.error("BREVO FULL ERROR:", err.response?.body || err);
    throw err;
  }
};

module.exports = sendMail;
