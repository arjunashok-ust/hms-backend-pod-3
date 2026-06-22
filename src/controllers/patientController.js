const Patient = require("../models/Patient");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

/* ================================
   CREATE PATIENT (staff-created, e.g. walk-in registration)
   ================================ */
exports.createPatient = asyncHandler(async (req, res) => {
  const { email, name, phone, gender, date_of_birth, bloodGroup, allergies, address, emergencyContact } = req.body;

  if (email) {
    const existing = await Patient.findOne({ email });
    if (existing) {
      throw new ApiError(409, "Patient already exists", "PATIENT_EXISTS");
    }
  }

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

  return res
    .status(201)
    .json(new ApiResponse(201, "Patient Created Successfully", { patient }));
});

/* ================================
   UPDATE PATIENT (staff-side, by UHID/id — not self)
   ================================ */
exports.updatePatient = asyncHandler(async (req, res) => {

  const { id } = req.params;

  const patient = await Patient.findOne({ UHID: id });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  Object.assign(patient, req.body);
  await patient.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Patient Updated Successfully", { patient }));
});

/* ================================
   DELETE PATIENT
   ================================ */
exports.deletePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await Patient.findOne({ UHID: id });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  await patient.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, "Patient Deleted Successfully"));
});

/* ================================
   GET ALL PATIENTS (PAGINATED)
   ================================ */
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};

  /* OPTIONAL STATUS FILTER (?status=true/false) */
  if (req.query.status !== undefined) {
    filter.status = req.query.status === "true";
  }

  /* OPTIONAL SEARCH BY NAME OR EMAIL (?search=john) */
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { email: { $regex: req.query.search, $options: "i" } },
    ];
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

/* ================================
   GET SINGLE PATIENT (by UHID)
   ================================ */
exports.getSinglePatient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const patient = await Patient.findOne({ UHID: id });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Patient fetched successfully", { patient }));
});

/* ================================
   PATIENT UI STATS
   ================================ */
exports.getPatientUI = asyncHandler(async (req, res) => {
  const totalPatients = await Patient.countDocuments();
  const activePatients = await Patient.countDocuments({ status: true });
  const inactivePatients = await Patient.countDocuments({ status: false });

  return res.status(200).json(
    new ApiResponse(200, "Patient stats fetched successfully", {
      totalPatients,
      activePatients,
      inactivePatients,
    })
  );
});