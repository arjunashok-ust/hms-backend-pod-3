process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const Brevo = require("sib-api-v3-sdk");

const client = Brevo.ApiClient.instance;

const apiKey =
  client.authentications["api-key"];

apiKey.apiKey =
  process.env.BREVO_API_KEY;

const apiInstance =
  new Brevo.TransactionalEmailsApi();

const sendVerificationMail = async (
    to,
    name,
    verificationLink
) => {

    try {

        const response =
            await apiInstance.sendTransacEmail({

            sender: {

                email:
                    process.env.EMAIL_USER,

                name:
                    "HMS System",

            },

            to: [

                {
                    email: to
                }

            ],

            subject:
                "HMS Email Verification",

            htmlContent: `

                <h2>
                  Welcome to HMS
                </h2>

                <p>
                  Hello ${name},
                </p>

                <p>

                  Your account has been
                  created successfully.

                </p>

                <p>

                  Please verify your
                  email by clicking
                  below.

                </p>

                <br>

                <a href="${verificationLink}">

                  Verify Email

                </a>

            `

        });

        console.log(
            "Verification Email Sent"
        );

        return response;

    }

    catch (err) {

        console.log(
            "BREVO FULL ERROR:",
            err.response?.body || err
        );

        throw err;

    }

};

module.exports = sendVerificationMail;