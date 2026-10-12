const config = require('../config/app.config');
const { EMAIL_SUBJECTS } = require('../constants/messages.constants');

const escapeHtml = (value) =>
    String(value ?? '').replaceAll(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);

const buildVerifyEmailUrl = (email, token) =>
    `${config.publicApiUrl}/auth/verify-email?email=${encodeURIComponent(email)}&verification_token=${encodeURIComponent(token)}`;

const credentialsBlock = (email, password) => `
    Email : <b>${escapeHtml(email)}</b><br>
    Password : <b>${escapeHtml(password)}</b><br>`;

const employeeCredentials = ({ email, password }) => ({
    subject: EMAIL_SUBJECTS.EMPLOYEE_CREDENTIALS,
    html: `
        <h1>Hospital Management System</h1><br>
        <p>Your profile has been registered, you can now login using the credentials below.<br>
        ${credentialsBlock(email, password)}
        </p>`,
});

const adminApproval = ({ name, email }) => ({
    subject: EMAIL_SUBJECTS.ADMIN_APPROVAL,
    html: `
        <h1>Hospital Management System</h1><br>
        <p>A new user has registered on the <b>HMS</b> platform and is awaiting your approval.</p>
        <p>
        <b>User Details:</b><br>
        Name: ${escapeHtml(name)}<br>
        Email: ${escapeHtml(email)}<br>
        </p>`,
});

const emailVerification = ({ name, email, token, subject = EMAIL_SUBJECTS.EMPLOYEE_VERIFICATION }) => ({
    subject,
    html: `
        <h1>Hospital Management System</h1><br>
        <p>Thank you ${escapeHtml(name)} for registering with <b>hms</b>, you can now verify your email by clicking the button below.</p><br>
        <a href="${buildVerifyEmailUrl(email, token)}">
        <input type="Button" value="Verify">
        </a>`,
});

const patientCredentials = ({ email, password }) => ({
    subject: EMAIL_SUBJECTS.PATIENT_CREDENTIALS,
    html: `
        <h1>HMS App</h1><br>
        <p>Your profile has been registered, you can now login using the credentials below.<br>
        ${credentialsBlock(email, password)}
        </p>`,
});

const passwordReset = ({ email, password }) => ({
    subject: EMAIL_SUBJECTS.PASSWORD_RESET,
    html: `
        <h1>Hospital Management System</h1>
        <p>Your password has been reset. Use the temporary credentials below to sign in.</p>
        <hr>
        <h3>Login Credentials</h3>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Temporary Password:</strong> ${escapeHtml(password)}</p>
        <p>For security, we recommend changing your password immediately after login.</p>
        <br>`,
});

module.exports = {
    escapeHtml,
    buildVerifyEmailUrl,
    employeeCredentials,
    adminApproval,
    emailVerification,
    patientCredentials,
    passwordReset,
};
