const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const mail = require('../utils/mail.utils')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenGenerator.util')

const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Role = require('../models/role.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');

// SignUp
const signUp = asyncHandler(async (req, res) => {
    const {
        name,
        role,
        email,
        password,
        department,
        designation,
        status,
        joiningDate,
        medicalRegistrationNo,
        specialization,
        qualification,
        consultationFee,
        availabilitySlots,
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw ERR.emailExists();
    }

    if (['Doctor', 'Nurse', 'Pharmacist', 'LabTech'].includes(role)) {
        // if it contains any value
        if (medicalRegistrationNo) {
            const medicalRegNo = await Employee.findOne({ medicalRegistrationNo });
            if (medicalRegNo) {
                throw ERR.uniqueMedRegNo();
            }
        }
    }

    const profile = await Employee.create({
        name,
        email,
        department,
        designation,
        status,
        joiningDate,
        medicalRegistrationNo,
        specialization,
        qualification,
        consultationFee,
        availabilitySlots
    });

    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expiry = Date.now() + 60 * 60 * 24 * 1000;

    if (!profile) {
        throw ERR.userNotFound();
    }

    let userPassword;

    // if admin
    if (status == 'Active') {
        userPassword = crypto.randomBytes(12).toString('hex');
        console.log("temp password",userPassword);
        // user credentials
        await mail.sendMail({
            to: profile.email,
            subject: 'HMS System | Employee Credentials',
            html: `
            <h1>Hospital Management System</h1><br>
            <p> Your profile has been registered,you can now login using the credentials below.<br>
            Email : <b>${profile.email}</b><br>
            Password : <b>${userPassword}</b><br>
            </p>
            `
        });
    }
    else {
        // email for admin 
        await mail.sendMail({
            to: process.env.ADMIN_MAIL,
            subject: 'HMS Notification | User Approval',
            html: `
            <h1>Hospital Management System</h1><br>
            <p> A new user has registered on the <b>HMS</b> platform and is awaiting your approval.</p>
            <p>
            <b>User Details:</b><br>
            Name: ${profile.name}<br>
            Email: ${profile.email}<br>
            </p>
            `
        });
        userPassword = password;
    }

    // user email verification
    await mail.sendMail({
        to: profile.email,
        subject: 'HMS System | User Email Verification',
        html: `
            <h1>Hospital Management System</h1><br>
            <p>Thank you ${profile.name} for registering with <b>hms</b>,You can now verify your email by clicking the button below.</p><br>
            <a href="https://hms.fortrancer.in/auth/verify-email?email=${profile.email}&verification_token=${verification_token}">
            <input type="Button" value="Verify">
            </a>
            `
    });

    console.log(`verify url: https://hms.fortrancer.in/auth/verify-email?email=${profile.email}&verification_token=${verification_token}`);

    const passwordHash = await bcrypt.hash(userPassword, 12);

    await User.create({
        email: email,
        passwordHash: passwordHash,
        status: status,
        role: role,
        employeeId: profile.employeeCode,
        verification_token: verification_token,
        verification_expiry: verification_expiry,
        isVerified: false,
        firstLogin: status === "Active",
    });

    // 201 created
    return res.status(201).json({
        message: "account created sucessfully.",
        email: email,
    });
});

// Login
const login = asyncHandler(async (req, res) => {
    const {
        email,
        password,
        isClientApp,
    } = req.body;

    const existingUser = await User.findOne({ email, isDeleted: false });

    if (!existingUser) {
        throw ERR.invalidCredentials();
    }

    const isMatch = await bcrypt.compare(password, existingUser.passwordHash);

    if (!isMatch) {
        throw ERR.invalidCredentials();
    }

    if (!existingUser.isVerified) {
        throw ERR.emailNotVerified();
    }

    if (existingUser.status != 'Active') {
        throw ERR.accountNotActivated();
    }

    if (isClientApp) {
        if (existingUser.role != 'Patient') {
            throw ERR.clientMobileApp();
        }
    }

    existingUser.lastLoginAt = Date.now();

    const payload = {
        userId: existingUser.employeeId || existingUser.patientId,
        email: existingUser.email,
        role: existingUser.role,
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    existingUser.refresh_token = refreshToken;
    await existingUser.save();

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
    });

    return res.status(200).json({
        message: 'login sucessfull',
        email: existingUser.email,
        token: accessToken,
        role: existingUser.role,
        status: existingUser.status,
        firstLogin: existingUser.firstLogin,
    });
});

// set password for first time users
const setPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
        throw ERR.userNotFound();
    }

    const status = user.firstLogin;

    if (!status) {
        throw ERR.setPassword();
    }

    const passwordHash = await bcrypt.hash(password, 12);
    user.passwordHash = passwordHash;
    user.firstLogin = false;
    await user.save();

    return res.status(200).json({ message: 'Password Is Set' });
});

// verify mail
const verifyMail = asyncHandler(async (req, res) => {
    const {
        email,
        verification_token
    } = req.query;

    const user = await User.findOne({ email });

    if (!user) {
        throw ERR.userNotFound();
    }

    if (verification_token != user.verification_token) {
        throw ERR.verificationTokenInvalid();
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({ message: "Email Verified Successfully" });
});

const patientSignUp = asyncHandler(async (req, res) => {
    const {
        name,
        role,
        email,
        password,
        status,
        phone,
        gender,
        dob,
        address,
        bloodGroup,
        allergies,
        emergencyContact
    } = req.body;

    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
        // 409 conflict
        throw ERR.emailExists();
    }

    const existingPhone = await Patient.findOne({ phone });

    if (existingPhone) {
        // 409 conflict
        throw ERR.phoneExists();
    }

    const profile = await Patient.create({
        name,
        email,
        status,
        phone,
        gender,
        dob,
        address,
        bloodGroup,
        allergies,
        emergencyContact
    });

    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expiry = Date.now() + 60 * 60 * 24;

    if (!profile) {
        throw ERR.userNotFound();
    }

    let userPassword;

    if (status == 'Active') {
        userPassword = password;
    } else {
        const tempPassword = crypto.randomBytes(12).toString('hex');
        userPassword = tempPassword;

        // user credentials
        await mail.sendMail({
            to: profile.email,
            subject: 'HMS App | Patient Credentials',
            html: `
            <h1>HMS App</h1><br>
            <p> Your profile has been registered,you can now login using the credentials below.<br>
            Email : <b>${profile.email}</b><br>
            Password : <b>${userPassword}</b><br>
            </p>
            `
        });
    }

    console.log(`Patient Password : ${userPassword}`);

    const passwordHash = await bcrypt.hash(userPassword, 12);

    await User.create({
        email: email,
        passwordHash: passwordHash,
        status: 'Active',
        role: role,
        patientId: profile.uhid,
        verification_token: verification_token,
        verification_expiry: verification_expiry,
        isVerified: false,
        firstLogin: false,
    });

    // user email verification
    await mail.sendMail({
        to: profile.email,
        subject: 'HMS System | Patient Email Verification',
        html: `
            <h1>Hospital Management System</h1><br>
            <p>Thank you ${profile.name} for registering with <b>hms</b>,You can now verify your email by clicking the button below.</p><br>
            <a href="https://hms.fortrancer.in/auth/verify-email?email=${profile.email}&verification_token=${verification_token}">
            <input type="Button" value="Verify">
            </a>
            `
    });

    console.log(`verify url: https://hms.fortrancer.in/auth/verify-email?email=${profile.email}&verification_token=${verification_token}`);

    // 201 created
    return res.status(201).json({
        message: "Account created sucessfully.",
        email: email,
    });
});

const getPermissions = asyncHandler(async (req, res) => {
    const role = req.query.role;

    const roleData = await Role.findOne({ role_name: role });
    if (!roleData) {
        ERR.unknownRole();
    }

    return res.status(200).json(roleData);
});

const getAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) throw ERR.tokenNotFound()

    const user = await User.findOne({ refresh_token: refreshToken });
    if (!user) throw ERR.tokenInvalidOrExpired();

    try {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
    } catch (err) {
        console.error(err);
        throw ERR.tokenInvalidOrExpired();
    }

    const payload = {
        userId: user.employeeId || user.patientId,
        email: user.email,
        role: user.role,
    }

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refresh_token = newRefreshToken;
    await user.save();

    res.cookie("refresh_token", newRefreshToken, { httpOnly: true, secure: false, sameSite: "lax" });
    return res.status(200).json({ token: newAccessToken });
});

const logout = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const user = await User.findOne({
        $or: [
            { employeeId: userId },
            { patientId: userId }
        ]
    });

    if (!user) {
        throw ERR.userNotFound();
    }

    user.refresh_token = null;
    await user.save();


    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    return res.status(200).json({ message: "User logged out successfully" });
});

const resetPassword = asyncHandler(async (req, res) => {
    const email = req.body.email;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json({ message: `Reset link is sent to mail` });
    }

    const reset_token = await crypto.randomBytes(32).toString("hex");
    const temp_password = await crypto.randomBytes(12).toString("hex");
    const hashed_password = await bcrypt.hash(temp_password, 12);

    user.reset_token = reset_token;
    user.passwordHash = hashed_password;
    await user.save();

    // send verification mail
    await mail.sendMail({
        to: user.email,
        subject: 'HMS System | Password Reset',
        html: `
            <h1>Hospital Management System</h1>
            <p>You can reset your password by clicking the button below.</p>
            <hr>
            <h3>Login Credentials</h3>
            <p>
                <strong>Email:</strong> ${user.email}
            </p>
            <p>
                <strong>Temporary Password:</strong> ${temp_password}
            </p>
                <p>
                Please use the above credentials to sign in after resetting your password. For security, we recommend changing your password immediately after login.
                </p>
            <br>
            <a href="https://hms.fortrancer.in:8080/auth/verify-reset-password?email=${user.email}&reset_token=${user.reset_token}">
                <input type="button" value="Reset Password">
            </a>`
    });

    console.log(`reset link: http://hms.fortrancer.in:8080/auth/verify-reset-password?email=${user.email}&reset_token=${user.reset_token}`);
    console.log(`temp password: ${temp_password}`);
    return res.status(200).json({ message: `Reset link is sent to mail` });
});

const verifyResetPassword = asyncHandler(async (req, res) => {
    const email = req.query.email;
    const reset_token = req.query.reset_token;

    const user = await User.findOneAndUpdate({ email, reset_token }, { reset_token: '', firstLogin: true });
    if (!user) {
        throw ERR.userNotFound();
    }

    return res.status(200).json({ message: 'Password reset successfull.' });
});

module.exports = { signUp, login, setPassword, verifyMail, patientSignUp, getPermissions, getAccessToken, logout, resetPassword, verifyResetPassword };

