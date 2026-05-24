process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Brevo = require("sib-api-v3-sdk");
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new Brevo.TransactionalEmailsApi();
const sendFormSignupMail = async (to, employeeId) => {
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
                <h2>Hello Super Admin</h2>
                <p>An employee profile has been created using form,it needs your approval.</p>
                <p>Kindly verify and take necessary steps.</p>
                <p>
                    Employee Id:${employeeId}
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

module.exports = sendFormSignupMail;
