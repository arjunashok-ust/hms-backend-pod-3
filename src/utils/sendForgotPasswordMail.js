process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Brevo = require("sib-api-v3-sdk");

const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

const sendForgotPasswordMail = async (to, tempPassword) => {
  try {
    const response = await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.EMAIL_USER,
        name: "HMS System",
      },

      to: [
        {
          email: to,
        },
      ],

      subject: "HMS Password Reset",

      htmlContent: `
        <h2>Password Reset Request</h2>

        <p>A temporary password has been generated for your account.</p>

        <p>
          <strong>Email:</strong>
          ${to}
        </p>

        <p>
          <strong>Temporary Password:</strong>
          ${tempPassword}
        </p>

        <p>
          Please login using this temporary password and reset your password immediately.
        </p>
      `,
    });

    console.log("Password reset email sent successfully");
    return response;
  } catch (err) {
    console.log("BREVO FULL ERROR:", err.response?.body || err);
    throw err;
  }
};

module.exports = sendForgotPasswordMail;
