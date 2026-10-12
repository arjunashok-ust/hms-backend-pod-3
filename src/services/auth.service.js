const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');

const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Role = require('../models/role.model');

const notification = require('./notification.service');
const ERR = require('../utils/errors.utils');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenGenerator.util');
const { SUCCESS_MESSAGES } = require('../constants/messages.constants');
const { ROLES, MEDICAL_ROLES } = require('../constants/roles.constants');
const { USER_STATUS, BCRYPT_ROUNDS, ONE_DAY_MS } = require('../constants/app.constants');

const newVerification = () => ({
    verification_token: crypto.randomBytes(32).toString('hex'),
    verification_expiry: new Date(Date.now() + ONE_DAY_MS),
});

const tokenPayload = (user) => ({
    userId: user.employeeId || user.patientId,
    email: user.email,
    role: user.role,
});

// removes the profile again when the account could not be created, so no orphan profile is left behind
const createAccountOrRollback = async (profile, accountData) => {
    try {
        await User.create(accountData);
    } catch (err) {
        await profile.deleteOne();
        throw err;
    }
};

const signUp = async (input) => {
    const { email, role, status, password, medicalRegistrationNo } = input;
    const isActive = status === USER_STATUS.ACTIVE;

    if ((await User.exists({ email })) || (await Employee.exists({ email }))) {
        throw ERR.emailExists();
    }

    if (MEDICAL_ROLES.includes(role) && medicalRegistrationNo && (await Employee.exists({ medicalRegistrationNo }))) {
        throw ERR.uniqueMedRegNo();
    }

    const profile = await Employee.create({
        name: input.name,
        email,
        department: input.department,
        designation: input.designation,
        joiningDate: input.joiningDate,
        medicalRegistrationNo,
        specialization: input.specialization,
        qualification: input.qualification,
        consultationFee: input.consultationFee,
        availabilitySlots: input.availabilitySlots,
    });

    // an admin creating the account gets a generated password mailed to the employee
    const userPassword = isActive ? crypto.randomBytes(12).toString('hex') : password;
    const verification = newVerification();

    await createAccountOrRollback(profile, {
        email,
        passwordHash: await bcrypt.hash(userPassword, BCRYPT_ROUNDS),
        status,
        role,
        employeeId: profile.employeeCode,
        ...verification,
        isVerified: false,
        firstLogin: isActive,
    });

    await Promise.all([
        isActive
            ? notification.sendEmployeeCredentials({ email, password: userPassword })
            : notification.sendAdminApprovalRequest({ name: profile.name, email }),
        notification.sendEmployeeVerification({ name: profile.name, email, token: verification.verification_token }),
    ]);

    return { message: SUCCESS_MESSAGES.ACCOUNT_CREATED, email };
};

const patientSignUp = async (input) => {
    const { email, phone, status, password } = input;
    const isActive = status === USER_STATUS.ACTIVE;

    if ((await Patient.exists({ email })) || (await User.exists({ email }))) {
        throw ERR.emailExists();
    }

    if (await Patient.exists({ phone })) {
        throw ERR.phoneExists();
    }

    const profile = await Patient.create({
        name: input.name,
        email,
        status,
        phone,
        gender: input.gender,
        dob: input.dob,
        address: input.address,
        bloodGroup: input.bloodGroup,
        allergies: input.allergies,
        emergencyContact: input.emergencyContact,
    });

    // an active patient chose their own password, otherwise one is generated and mailed
    const userPassword = isActive ? password : crypto.randomBytes(12).toString('hex');
    const verification = newVerification();

    await createAccountOrRollback(profile, {
        email,
        passwordHash: await bcrypt.hash(userPassword, BCRYPT_ROUNDS),
        status: USER_STATUS.ACTIVE,
        role: ROLES.PATIENT,
        patientId: profile.uhid,
        ...verification,
        isVerified: false,
        firstLogin: false,
    });

    await Promise.all([
        isActive ? undefined : notification.sendPatientCredentials({ email, password: userPassword }),
        notification.sendPatientVerification({ name: profile.name, email, token: verification.verification_token }),
    ]);

    return { message: SUCCESS_MESSAGES.ACCOUNT_CREATED, email };
};

const login = async ({ email, password, isClientApp }) => {
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) throw ERR.invalidCredentials();

    if (!(await bcrypt.compare(password, user.passwordHash))) throw ERR.invalidCredentials();
    if (!user.isVerified) throw ERR.emailNotVerified();
    if (user.status !== USER_STATUS.ACTIVE) throw ERR.accountNotActivated();
    if (isClientApp && user.role !== ROLES.PATIENT) throw ERR.clientMobileApp();

    const payload = tokenPayload(user);
    const refreshToken = generateRefreshToken(payload);

    user.lastLoginAt = new Date();
    user.refresh_token = refreshToken;
    await user.save();

    return {
        message: SUCCESS_MESSAGES.LOGIN,
        email: user.email,
        token: generateAccessToken(payload),
        role: user.role,
        status: user.status,
        firstLogin: user.firstLogin,
        refreshToken,
    };
};

const setPassword = async (actor, { password }) => {
    const user = await User.findOne({ email: actor.email, isDeleted: false });
    if (!user) throw ERR.userNotFound();
    if (!user.firstLogin) throw ERR.setPassword();

    user.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    user.firstLogin = false;
    await user.save();

    return { message: SUCCESS_MESSAGES.PASSWORD_SET };
};

const verifyEmail = async ({ email, verificationToken }) => {
    const user = await User.findOne({ email });
    if (!user) throw ERR.userNotFound();
    if (!user.verification_token || user.verification_token !== verificationToken) {
        throw ERR.verificationTokenInvalid();
    }

    user.isVerified = true;
    await user.save();

    return { message: SUCCESS_MESSAGES.EMAIL_VERIFIED };
};

const getPermissions = async ({ role }) => {
    const roleData = await Role.findOne({ role_name: role }).lean();
    if (!roleData) throw ERR.unknownRole();
    return roleData;
};

// rotates the refresh token on every use
const refreshSession = async (refreshToken) => {
    if (!refreshToken) throw ERR.refreshTokenMissing();

    try {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
        throw ERR.sessionExpired();
    }

    const user = await User.findOne({ refresh_token: refreshToken, isDeleted: false });
    if (!user) throw ERR.sessionExpired();

    const payload = tokenPayload(user);
    const newRefreshToken = generateRefreshToken(payload);

    user.refresh_token = newRefreshToken;
    await user.save();

    return { token: generateAccessToken(payload), refreshToken: newRefreshToken };
};

const logout = async (actor) => {
    const { matchedCount } = await User.updateOne(
        { $or: [{ employeeId: actor.userId }, { patientId: actor.userId }] },
        { refresh_token: null },
    );
    if (!matchedCount) throw ERR.userNotFound();

    return { message: SUCCESS_MESSAGES.LOGOUT };
};

// always answers the same way so the endpoint cannot be used to find out which emails are registered
const resetPassword = async ({ email }) => {
    const user = await User.findOne({ email, isDeleted: false });

    if (user) {
        const temporaryPassword = crypto.randomBytes(12).toString('hex');

        user.reset_token = crypto.randomBytes(32).toString('hex');
        user.firstLogin = true;
        user.passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
        await user.save();

        await notification.sendPasswordReset({ email: user.email, password: temporaryPassword });
    }

    return { message: SUCCESS_MESSAGES.RESET_LINK_SENT };
};

const verifyResetPassword = async ({ email, resetToken }) => {
    const user = await User.findOneAndUpdate({ email, reset_token: resetToken }, { reset_token: '', firstLogin: true });
    if (!user) throw ERR.userNotFound();

    return { message: SUCCESS_MESSAGES.PASSWORD_RESET };
};

module.exports = {
    signUp,
    patientSignUp,
    login,
    setPassword,
    verifyEmail,
    getPermissions,
    refreshSession,
    logout,
    resetPassword,
    verifyResetPassword,
};
