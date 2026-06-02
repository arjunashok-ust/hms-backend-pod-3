// utils/sendFormSignupMail.js
const sendMail = require("./mailer");

const sendFormSignupMail  = (to, employeeId) =>
  sendMail({
    to,
    subject: "New Employee Pending Approval",
    html: `<h2>Hello Admin</h2>
           <p>Employee ${employeeId} registered via form and needs approval.</p>`,
  });

module.exports = sendFormSignupMail;