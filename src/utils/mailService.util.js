process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const brevo = require("sib-api-v3-sdk");
const client = brevo.ApiClient.instance;
const apikey = client.authentications["api-key"];
apikey.apiKey = process.env.BREVO_API_KEY;
const apiInstance = new brevo.TransactionalEmailsApi();

const sendEmail = async({to, subject, html}) => {
    try {
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_USER,
                name: "HMS SYSTEM"
            },
            to : [{ email: to }],
            subject: subject,
            htmlContent: html
        });
        console.log("email successfully sent: "+response);
    } catch(err) {
        console.error(err);
        throw(err);
    }
}

module.exports = { sendEmail };