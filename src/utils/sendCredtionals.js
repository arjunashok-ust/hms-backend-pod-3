// utils/sendCredentialsMail.js
const sendMail = require("./mailer");

const sendEmployeeCredentials  = (to, tempPassword) =>
  sendMail({
    to,
    subject: "HMS Employee Credentials",
    html: `<h2>Welcome to HMS</h2>
           <p>Email: ${to}</p>
           <p>Temporary Password: ${tempPassword}</p>
           <p>Please reset your password after login.</p>`,
  });

module.exports = sendEmployeeCredentials;