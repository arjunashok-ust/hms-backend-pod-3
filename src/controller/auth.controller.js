const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const mail = require('../utils/mail.utils')

const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model');

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

    let userPassword = "";

    // if admin
    if (status == 'Active') {
        userPassword = crypto.randomBytes(12).toString('hex');
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
            <a href="http://localhost:5000/auth/verify-email?email=${profile.email}&verification_token=${verification_token}">
            <input type="Button" value="Verify">
            </a>
            `
    });

        console.log(`verify url: http://localhost:5000/auth/verify-email?email=${profile.email}&verification_token=${verification_token}`);

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

    const existingUser = await User.findOne({ email });

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
    await existingUser.save();

    const token = jwt.sign(
        {
            userId: existingUser.employeeId || existingUser.patientId,
            email: existingUser.email,
            role: existingUser.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN })

    return res.status(200).json({
        message: 'login sucessfull',
        email: existingUser.email,
        token: token,
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
        emergencyContact
    });

    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expiry = Date.now() + 60 * 60 * 24;

    if (!profile) {
        throw ERR.userNotFound();
    }

    let userPassword = "";

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
            <a href="http://localhost:5000/auth/verify-email?email=${profile.email}&verification_token=${verification_token}">
            <input type="Button" value="Verify">
            </a>
            `
    });

        console.log(`verify url: http://localhost:5000/auth/verify-email?email=${profile.email}&verification_token=${verification_token}`);

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

module.exports = { signUp, login, setPassword, verifyMail, patientSignUp, getPermissions };

