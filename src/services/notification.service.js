const mail = require('../utils/mail.utils');
const templates = require('../utils/emailTemplates.utils');
const config = require('../config/app.config');
const { EMAIL_SUBJECTS } = require('../constants/messages.constants');

// Mails are sent after the database write succeeded, so a mail outage must not fail the request.
// Failures are logged and the caller can resend through the reset password flow.
const send = async (to, template) => {
    try {
        await mail.sendMail({ to, ...template });
        return true;
    } catch (err) {
        console.error(`mail "${template.subject}" to ${to} failed:`, err.message);
        return false;
    }
};

const sendEmployeeCredentials = ({ email, password }) =>
    send(email, templates.employeeCredentials({ email, password }));

const sendAdminApprovalRequest = ({ name, email }) =>
    send(config.adminMail, templates.adminApproval({ name, email }));

const sendEmployeeVerification = ({ name, email, token }) =>
    send(email, templates.emailVerification({ name, email, token }));

const sendPatientCredentials = ({ email, password }) =>
    send(email, templates.patientCredentials({ email, password }));

const sendPatientVerification = ({ name, email, token }) =>
    send(email, templates.emailVerification({ name, email, token, subject: EMAIL_SUBJECTS.PATIENT_VERIFICATION }));

const sendPasswordReset = ({ email, password }) =>
    send(email, templates.passwordReset({ email, password }));

module.exports = {
    sendEmployeeCredentials,
    sendAdminApprovalRequest,
    sendEmployeeVerification,
    sendPatientCredentials,
    sendPatientVerification,
    sendPasswordReset,
};
