process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Brevo = require("sib-api-v3-sdk");
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new Brevo.TransactionalEmailsApi();
const sendEmployeeCredentials = async (to, tempPassword) => {
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

      subject: "HMS Employee Credentials",

      htmlContent: `

                <h2>Welcome to HMS</h2>

                <p>Your employee account has been created.</p>

                <p>
                    <strong>Email:</strong>
                    ${to}
                </p>

                <p>
                    <strong>Temporary Password:</strong>
                    ${tempPassword}
                </p>

                <p>
                    Please reset your password after login.
                </p>

            `,
    });
    console.log("Email sent successfully");
    return response;
  } catch (err) {
      console.log(
          "BREVO FULL ERROR:",
          err.response?.body || err
      );
    throw err;
  }
};

module.exports = sendEmployeeCredentials;
