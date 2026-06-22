const MedicalRecord = require("../models/MedicalRecord");
const Role = require("../models/Role");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const PERMISSIONS = require("../constants/permissions");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

//Create Medical Record
exports.createMedicalRecord = asyncHandler(async (req, res) => {
  const {
    doctorEmployeeId,
    appointmentId,
    patientId,
    status,
    diagnosis,
    complaint,
    symptoms,
    medications,
    medicalObservations,
    notes,
  } = req.body;

  if (!doctorEmployeeId || !appointmentId || !patientId) {
    throw new ApiError(
      400,
      "doctorEmployeeId, appointmentId, and patientId are required.",
      "VALIDATION_ERROR"
    );
  }

  const recordStatus = status === "DRAFT" ? "DRAFT" : "FINAL";

  const newRecord = new MedicalRecord({
    doctorEmployeeId,
    appointmentId,
    patientId,
    diagnosis,
    complaint,
    symptoms,
    medications: medications || [],
    medicalObservations: medicalObservations || [],
    notes,
    status: recordStatus,
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });

  await newRecord.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        `Medical record successfully saved as ${recordStatus}.`,
        { record: newRecord }
      )
    );
});

//Get Medical Records (PAGINATED)
exports.getMedicalRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { status: { $ne: "DELETED" } };

  if (req.query.patientId) filter.patientId = req.query.patientId;
  if (req.query.doctorEmployeeId)
    filter.doctorEmployeeId = req.query.doctorEmployeeId;
  if (req.query.appointmentId) filter.appointmentId = req.query.appointmentId;
  if (req.query.status) filter.status = req.query.status;

  /* DOCTORS ONLY SEE THEIR OWN RECORDS — forcibly overrides any doctorEmployeeId
     query param, same pattern as appointmentController.js's getAllAppointments. */
  if (req.user.role === "doctor") {
    const doctorUser = await User.findById(req.user.id);
    filter.doctorEmployeeId = doctorUser.employeeId;
  }

  const totalCount = await MedicalRecord.countDocuments(filter);

  const records = await MedicalRecord.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  /* Enrich with doctor/patient names regardless of current active status —
     historical records must still show a real name, not just an ID, even if
     the doctor/patient has since been deactivated (same pattern as
     appointmentController.js's getAllAppointments). */
  const enrichedRecords = await Promise.all(
    records.map(async (record) => {
      const doctor = await Employee.findOne({ employeeId: record.doctorEmployeeId });
      const patient = await Patient.findOne({ UHID: record.patientId });

      return {
        ...record.toObject(),
        doctorName: doctor?.name || "Unknown Doctor",
        patientName: patient?.name || "Unknown Patient",
      };
    })
  );

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Medical records fetched successfully", enrichedRecords, meta));
});

/* ================================
   UPDATE MEDICAL RECORD
   ================================ */
exports.updateMedicalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const record = await MedicalRecord.findById(id);
  if (!record) {
    throw new ApiError(404, "Medical record not found.", "RECORD_NOT_FOUND");
  }

  if (record.status === "DELETED") {
    throw new ApiError(400, "Cannot update a deleted record.", "RECORD_DELETED");
  }

  /* EXTRA CHECK: editing a FINAL record needs a stronger permission
     than the base EDIT_MEDICAL_RECORD already verified by route middleware.
     This is state-dependent, so it can't live in the static route guard. */
  if (record.status === "FINAL") {
    const roleDoc = await Role.findOne({ role_name: req.user.role }).select(
      "role_permissions"
    );
    const canUpdateFinalized = roleDoc?.role_permissions.includes(
      PERMISSIONS.UPDATE_FINALIZED_MEDICAL_RECORD
    );

    if (!canUpdateFinalized) {
      throw new ApiError(
        403,
        "Access Denied: This medical record is marked as FINAL. You lack the permission to edit finalized records.",
        "FORBIDDEN"
      );
    }
  }

  /* DOCTORS CAN ONLY EDIT THEIR OWN RECORDS — EDIT_MEDICAL_RECORD is a blanket
     permission grant, so ownership has to be enforced here, not in the route guard. */
  if (req.user.role === "doctor") {
    const requestingUser = await User.findById(req.user.id);
    if (record.doctorEmployeeId !== requestingUser.employeeId) {
      throw new ApiError(
        403,
        "Access Denied: You can only edit your own medical records.",
        "FORBIDDEN"
      );
    }
  }

  const {
    diagnosis,
    complaint,
    symptoms,
    medications,
    medicalObservations,
    notes,
    status,
  } = updates;

  if (diagnosis !== undefined) record.diagnosis = diagnosis;
  if (complaint !== undefined) record.complaint = complaint;
  if (symptoms !== undefined) record.symptoms = symptoms;
  if (medications !== undefined) record.medications = medications;
  if (medicalObservations !== undefined) record.medicalObservations = medicalObservations;
  if (notes !== undefined) record.notes = notes;
  if (status === "DRAFT" || status === "FINAL") record.status = status;

  record.updatedBy = req.user.id;
  await record.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Medical record updated successfully. Current status: ${record.status}`,
        { record }
      )
    );
});

/* ================================
   DELETE MEDICAL RECORD (soft delete)
   ================================ */
exports.deleteMedicalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await MedicalRecord.findById(id);
  if (!record) {
    throw new ApiError(404, "Medical record not found.", "RECORD_NOT_FOUND");
  }

  if (record.status === "DELETED") {
    throw new ApiError(400, "Record is already deleted.", "RECORD_DELETED");
  }

  record.status = "DELETED";
  record.updatedBy = req.user.id;
  await record.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Medical record successfully deleted."));
});