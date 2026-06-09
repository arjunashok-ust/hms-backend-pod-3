process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Brevo = require("sib-api-v3-sdk");
const client = Brevo.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new Brevo.TransactionalEmailsApi();
const mailVerification = async (to, employeeId) => {
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

      subject: "Verify Your HMS Account",

      htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 10px;">

    <h2 style="color: #2563eb;">
        Welcome to HMS
    </h2>

    <p>
        Hello,
    </p>

    <p>
        Your Hospital Management System account has been created successfully.
    </p>

    <p>
        To activate your account and continue using HMS, please verify your email address by clicking the button below.
    </p>

    <div style="text-align: center; margin: 30px 0;">
        <a
            href="http://localhost:5000/api/emp/verify/${employeeId}"
            style="
                background-color:#2563eb;
                color:white;
                padding:12px 24px;
                text-decoration:none;
                border-radius:6px;
                display:inline-block;
                font-weight:bold;
            "
        >
            Verify Email
        </a>
    </div>

    <p>
        If the button does not work, copy and paste the following link into your browser:
    </p>

    <p style="word-break: break-all; color:#2563eb;">
        http://localhost:5000/api/emp/verify/${employeeId}
    </p>

    <hr style="margin:20px 0;">

    <p>
        <strong>Employee ID:</strong> ${employeeId}
    </p>

    <p>
        If you did not request this account, please ignore this email.
    </p>

    <p>
        Regards,<br>
        HMS Team
    </p>

</div>
`,
    });
    console.log("Email sent successfully");
    return response;
  } catch (err) {
    console.log("BREVO FULL ERROR:", err.response?.body || err);
    throw err;
  }
};

module.exports = mailVerification;
