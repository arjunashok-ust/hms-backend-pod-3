const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Patients = require("../models/Patients");
const Roles = require("../models/Roles");
const sendMail = require("../utils/sendMail");
const ERR = require("../utils/errors.utils");

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const parseExpiry = (value, fallback) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return fallback;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    return trimmed;
  }
  return fallback;
};

const ACCESS_TOKEN_EXPIRES_IN = parseExpiry(process.env.JWT_EXPIRES_IN, "1d");
const REFRESH_TOKEN_EXPIRES_IN = parseExpiry(
  process.env.REFRESH_TOKEN_EXPIRES_IN,
  "7d",
);

const getTokenPayload = (user, permissions) => ({
  ...(user.role === "PATIENT"
    ? { patientId: user.patientUHID }
    : { employeeID: user.employeeID }),
  email: user.email,
  role: user.role,
  permissions,
});

const createAccessToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });

const createRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

const isProduction = process.env.NODE_ENV === "production";

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE,
    path: "/",
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
};

exports.signupByUser = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    department,
    designation,
    joiningDate,
    medicalRegistrationNo,
    specialization,
    qualification,
    consultationFee,
    weeklySchedule,
  } = req.body;

  const existingUser = await Users.findOne({ email });
  if (existingUser) throw ERR.emailAlreadyExists();

  if (medicalRegistrationNo) {
    const medicalRegNo = await Employees.findOne({ medicalRegistrationNo });
    if (medicalRegNo) throw ERR.medicalRegistrationNoExists();
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const newEmployee = await Employees.create({
    email,
    name,
    phone,
    department,
    designation,
    joiningDate,
    status: "ADMIN_APPROVAL_PENDING",
    role: role.toUpperCase(),
    medicalRegistrationNo,
    specialization,
    qualification,
    consultationFee,
    weeklySchedule,
  });

  const employeeID = newEmployee.employeeCode;
  const verification_token = crypto.randomBytes(32).toString("hex");
  const verification_expiry = Date.now() + 60 * 60 * 24 * 1000;

  const newUser = await Users.create({
    email,
    passwordHash,
    role: role.toUpperCase(),
    status: "ADMIN_APPROVAL_PENDING",
    employeeID,
    isEmailVerified: false,
    verification_token,
    verification_expiry,
  });

  await sendMail({
    to: newUser.email,
    subject: "HMS | Please verify your email address",
    htmlContent: `
        <h2>Welcome to HMS, ${name}</h2>
        <p>Before the Admin can approve your account, you must verify your email address.</p>
        <a href="${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${newUser.email}&token=${verification_token}">
          <button style="padding: 10px 20px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Verify Email
          </button>
        </a>
        <p>This link expires in 24 hours.</p>
      `,
  });

  const verifyEmailUrl = `${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${newUser.email}&token=${verification_token}`;

  res.status(201).json({
    message:
      "Registration successful. Please check your email to verify your account.",
    user: { employeeID },
    verifyEmailUrl,
  });
};

exports.signUpByAdmin = async (req, res) => {
  const {
    name,
    role,
    email,
    department,
    designation,
    phone,
    joiningDate,
    medicalRegistrationNo,
    specialization,
    qualification,
    consultationFee,
    weeklySchedule,
  } = req.body;

  if (role.toUpperCase() === "ADMIN") {
    const userPermissions = req.user?.permissions || [];
    if (!userPermissions.includes("CREATE_ADMIN")) {
      throw ERR.forbidden(
        "Access Denied: You do not have permission to create an Admin account.",
        "CREATE_ADMIN_FORBIDDEN",
      );
    }
  }

  const existingUser = await Employees.findOne({ email });
  if (existingUser) throw ERR.emailAlreadyExists();

  const targetMedicalRoles = new Set([
    "Doctor",
    "Nurse",
    "Pharmacist",
    "Lab_Tech",
  ]);
  const normalizedRole =
    role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  const hasMedicalRole =
    targetMedicalRoles.has(role) || targetMedicalRoles.has(normalizedRole);

  if (hasMedicalRole) {
    const medicalRegNo = await Employees.findOne({ medicalRegistrationNo });
    if (medicalRegNo) throw ERR.medicalRegistrationNoExists();
  }

  const tempPassword = crypto.randomBytes(6).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const profile = await Employees.create({
    name,
    email,
    department,
    designation,
    status: "PASSWORD_CHANGE_PENDING",
    phone,
    joiningDate,
    medicalRegistrationNo,
    specialization,
    qualification,
    consultationFee,
    weeklySchedule,
  });

  const verification_token = crypto.randomBytes(32).toString("hex");
  const verification_expiry = Date.now() + 60 * 60 * 24 * 1000;

  const user = await Users.create({
    email,
    passwordHash,
    role: role.toUpperCase(),
    employeeID: profile.employeeCode,
    verification_token,
    verification_expiry,
    status: "PASSWORD_CHANGE_PENDING",
  });

  await sendMail({
    to: user.email,
    subject: "HMS Employee Credentials",
    htmlContent: `
        <h2>Welcome to HMS</h2>
        <p>Your account credentials:</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please change your password immediately after your first sign in.</p>
      `,
  });

  await sendMail({
    to: user.email,
    subject: "HMS System | User Email Verification",
    htmlContent: `
        <h1>Hospital Management System</h1>
        <p>Thank you ${profile.name} for registering. Verify your account below:</p>
        <a href="${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}">
          <button>Verify Email</button>
        </a>
      `,
  });

  return res.status(201).json({
    message: "Account created successfully.",
    email,
    verifyEmailUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}`,
  });
};

exports.login = async (req, res) => {
  const { email, password, clientType } = req.body;
  const user = await Users.findOne({ email });

  if (!user) throw ERR.invalidCredentials();
  if (!clientType)
    throw ERR.invalidRequest(
      "Client type (MOBILE or WEB) is required for login.",
      "CLIENT_TYPE_REQUIRED",
    );
  if (clientType === "MOBILE" && user.role !== "PATIENT") {
    throw ERR.forbidden(
      "Access Denied: Staff and Admin accounts cannot log in via the mobile app.",
      "INVALID_CLIENT_TYPE",
    );
  }
  if (clientType === "WEB" && user.role === "PATIENT") {
    throw ERR.forbidden(
      "Access Denied: Patient accounts must use the mobile application to log in.",
      "INVALID_CLIENT_TYPE",
    );
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw ERR.invalidCredentials();

  if (!user.isEmailVerified)
    throw ERR.forbidden(
      "Please verify your email address before logging in.",
      "EMAIL_NOT_VERIFIED",
    );

  if (user.status === "ADMIN_APPROVAL_PENDING") {
    throw ERR.forbidden(
      "Your account is currently pending Admin approval. Please check back later.",
      "ACCOUNT_PENDING_APPROVAL",
    );
  }

  if (user.status === "PASSWORD_CHANGE_PENDING") {
    return res.status(200).json({
      requiresPasswordChange: true,
      email: user.email,
      message: "Security requirement: Please update your default password.",
    });
  }

  const roleExists = await Roles.findOne({ roleName: user.role });
  const permissions = roleExists ? roleExists.rolePermissions : [];
  user.lastLogin = new Date();

  const payload = getTokenPayload(user, permissions);
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken({ email: user.email });
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);
  await user.save();

  const profile =
    user.role === "PATIENT"
      ? await Patients.findOne({ email: user.email }).select("-__v")
      : await Employees.findOne({ email: user.email }).select("-__v");

  if (!profile)
    throw ERR.notFound(
      `Login successful, but ${user.role} profile is missing.`,
      "PROFILE_NOT_FOUND",
    );

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    message: "Login successful",
    accessToken,
    user: { profile, role: user.role },
  });
};

exports.changeFirstPassword = async (req, res) => {
  const { email, oldPassword, password } = req.body;

  const user = await Users.findOne({ email });
  if (!user) throw ERR.userNotFound();

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) throw ERR.invalidCredentials();

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(password, salt);
  user.status = "ACTIVE";

  const roleExists = await Roles.findOne({ roleName: user.role });
  const permissions = roleExists ? roleExists.rolePermissions : [];
  const payload = getTokenPayload(user, permissions);
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken({ email: user.email });
  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE);

  await user.save();
  await Employees.findOneAndUpdate(
    { employeeCode: user.employeeID },
    { $set: { status: "ACTIVE" } },
  );

  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    accessToken,
    user,
    message: "Password updated successfully. Logging in...",
  });
};

exports.refreshAccessToken = async (req, res) => {
  console.log(req.cookies);
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token missing" });

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch (err) {
    console.log(err);
    clearRefreshTokenCookie(res);
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }

  const user = await Users.findOne({ email: decoded.email });
  if (!user || user.refreshToken !== refreshToken) {
    clearRefreshTokenCookie(res);
    return res.status(401).json({ message: "Refresh token invalid" });
  }

  if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();
    clearRefreshTokenCookie(res);
    return res.status(401).json({ message: "Refresh token expired" });
  }

  const roleExists = await Roles.findOne({ roleName: user.role });
  const permissions = roleExists ? roleExists.rolePermissions : [];
  const payload = getTokenPayload(user, permissions);
  const accessToken = createAccessToken(payload);

  res.status(200).json({ accessToken });
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    const user = await Users.findOne({ refreshToken });
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      await user.save();
    }
  }
  clearRefreshTokenCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
};
