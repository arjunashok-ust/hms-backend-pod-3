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

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "Login Successful", {
      token,
      user: { id: user._id, email: user.email, role: user.role },
      patient,
    })
  );
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
    .limit(limit);

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Patients fetched successfully", patients, meta));
});

//Get All Doctors (PAGINATED)
exports.getAllDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const doctorUsers = await User.find({ role: "doctor", status: true });
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
    .limit(limit);

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctors fetched successfully", doctors, meta));
});
