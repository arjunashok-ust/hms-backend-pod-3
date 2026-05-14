process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const Brevo = require('sib-api-v3-sdk');

const client = Brevo.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

const sendMail = async ({to,subject,html}) => {
    try{
        const response = await apiInstance.sendTransacEmail({
            sender: {
                email: process.env.EMAIL_USER,
                name: "HMS System",
            },
            to: [{email: to}],
            subject: subject,
            htmlContent: html,
        });
    } catch(err) {
        console.error(err);
        throw(err);
    }
};

module.exports = { sendMail }
