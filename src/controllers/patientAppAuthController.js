const Patient = require("../models/Patient");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Appointment = require("../models/Appointment");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareToken,
} = require("../utils/tokenService");

//Patient SignUp
exports.patientSignup = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    phone,
    gender,
    date_of_birth,
    bloodGroup,
    allergies,
    address,
    emergencyContact,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "Email already registered", "EMAIL_EXISTS");
  }

  const password_hash = await bcrypt.hash(password, 12);

  const patient = await Patient.create({
    email,
    name,
    phone,
    gender,
    date_of_birth,
    bloodGroup,
    allergies,
    address,
    emergencyContact,
    status: true,
  });

  await User.create({
    email,
    password_hash,
    role: "patient",
    status: true,
    isFirstLogin: false,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Patient Registered Successfully", { patient }));
});

//=========================
//Patient Login
//=========================

exports.patientLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, role: "patient" });
  if (!user) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  const isPasswordValid = Boolean(
    await bcrypt.compare(password, user.password_hash)
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials", "INVALID_CREDENTIALS");
  }

  const patient = await Patient.findOne({ email });

  
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "Login Successful", {
      token,
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role },
      patient,
    })
  );
});

//=========================
//Patient Refresh (mobile) — refresh token comes from the request body
//(SecureStore), not a cookie. Rotates the refresh token.
//=========================

exports.patientRefresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new ApiError(401, "No refresh token", "NO_REFRESH_TOKEN");
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }

  const user = await User.findById(payload.id);
  if (
    !user ||
    user.role !== "patient" ||
    !user.refreshTokenHash ||
    !(await compareToken(refreshToken, user.refreshTokenHash))
  ) {
    throw new ApiError(401, "Session expired, please log in again", "REFRESH_REVOKED");
  }

  /* ROTATE: issue new access + refresh, replace stored hash. */
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  user.refreshTokenHash = await hashToken(newRefreshToken);
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "Token refreshed", {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    })
  );
});

//=========================
//Patient Logout (mobile) — revoke the refresh session.
//=========================

exports.patientLogout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.refreshTokenHash = null;
    await user.save();
  }

  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

//=============================
//Update Patient Profile
//=============================
exports.updatePatientProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ email: req.user.email });

  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  Object.assign(patient, req.body);
  await patient.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Profile Updated Successfully", { patient }));
});

//=============================
//Get All Patients (PAGINATED)
//=============================
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (req.query.status !== undefined) {
    filter.status = req.query.status === "true";
  }

  const totalCount = await Patient.countDocuments(filter);

  const patients = await Patient.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Patients fetched successfully", patients, meta));
});

//Get All Doctors (PAGINATED)
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const doctorUsers = await User.find({ role: "doctor", status: true }).select("employeeId").lean();
  const employeeIds = doctorUsers.map((doctor) => doctor.employeeId);

  const totalCount = await Employee.countDocuments({
    employeeId: { $in: employeeIds },
    status: true,
  });

  const doctors = await Employee.find({
    employeeId: { $in: employeeIds },
    status: true,
  })
    .skip(skip)
    .limit(limit)
    .lean();

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctors fetched successfully", doctors, meta));
});
