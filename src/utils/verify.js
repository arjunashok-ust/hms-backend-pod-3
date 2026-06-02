// utils/sendVerificationMail.js
const sendMail = require("./mailer");

const sendVerificationMail = (to, name, token) =>
  sendMail({
    to,
    subject: "HMS System | Email Verification",
    html: `<h2>Hospital Management System</h2>
           <p>Hello ${name}, <br>verify your email below:</p>
           <a href="${process.env.FRONTEND_URL}/verify-email?email=${to}&verification_token=${token}">
             Verify Email
           </a>`,
  });

module.exports = sendVerificationMail;