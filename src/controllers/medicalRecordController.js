const MedicalRecord = require("../models/MedicalRecords");
const Employees = require("../models/Employees");
const Appointments = require("../models/Appointments");
const Patients = require("../models/Patients");
const ERR = require("../utils/errors.utils");

exports.createMedicalRecord = async (req, res) => {
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
    throw ERR.invalidRequest(
      "doctorEmployeeId, appointmentId, and patientId are required.",
      "MEDICAL_RECORD_REQUIRED_FIELDS",
    );
  }

  const doctorExists = await Employees.findOne({
    employeeCode: doctorEmployeeId,
  });
  if (!doctorExists) throw ERR.doctorNotFound();

  const patientExists = await Patients.findOne({ UHID: patientId });
  if (!patientExists) throw ERR.patientNotFound();

  const appointmentExists = await Appointments.findOne({
    appointmentCode: appointmentId,
  });
  if (!appointmentExists) throw ERR.appointmentNotFound();

  const recordStatus = status === "DRAFT" ? "DRAFT" : "FINAL";

  const newRecord = await MedicalRecord.create({
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
    createdBy: req.user.employeeID,
    updatedBy: req.user.employeeID,
  });

  if(!recordStatus){
    const completedAppointment = await Appointments.findOneAndUpdate(
      { appointmentCode: appointmentId },
      { $set: { status: "Completed" } },
      { new: true },
    );
  }
  return res.status(201).json({
    success: true,
    message: `Medical record saved as ${recordStatus}.Appointment completed`,
    data: newRecord,
  });
};

const validateUpdatePermissions = (record, userPermissions) => {
  if (record.status === "DELETED") {
    return ERR.invalidRequest(
      "Cannot update a deleted record.",
      "MEDICAL_RECORD_DELETED",
    );
  }

  const canUpdateFinalized = userPermissions.includes(
    "UPDATE_FINALISED_RECORD",
  );
  if (record.status === "FINAL" && !canUpdateFinalized) {
    return ERR.forbidden(
      "Access Denied: Record is FINAL. You lack permission to edit finalized records.",
      "UPDATE_FINALIZED_RECORD_FORBIDDEN",
    );
  }

  return null;
};

const validateCriticalFieldPermissions = (updates, record, userPermissions) => {
  const attemptingCriticalUpdate =
    (updates.doctorEmployeeId &&
      updates.doctorEmployeeId !== record.doctorEmployeeId) ||
    (updates.patientId && updates.patientId !== record.patientId) ||
    (updates.appointmentId && updates.appointmentId !== record.appointmentId);

  if (
    attemptingCriticalUpdate &&
    !userPermissions.includes("UPDATE_CRITICAL_RECORD_FIELDS")
  ) {
    return ERR.forbidden(
      "Access Denied: You lack 'UPDATE_CRITICAL_RECORD_FIELDS' permission.",
      "UPDATE_CRITICAL_FIELDS_FORBIDDEN",
    );
  }
  return null;
};

exports.updateMedicalRecord = async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  const userPermissions = req.user.permissions || [];

  const record = await MedicalRecord.findById(id);
  if (!record)
    throw ERR.notFound("Medical record not found.", "MEDICAL_RECORD_NOT_FOUND");

  if (record.status === "FINAL") {
    throw ERR.conflict(
      "Cannot edit finalized record",
      "MEDICAL_RECORD_FINALIZED",
    );
  }

  const permissionError = validateUpdatePermissions(record, userPermissions);
  if (permissionError) throw permissionError;

  const criticalFieldError = validateCriticalFieldPermissions(
    updates,
    record,
    userPermissions,
  );
  if (criticalFieldError) throw criticalFieldError;

  const protectedFields = ["_id", "recordCode", "createdBy", "createdAt"];
  protectedFields.forEach((field) => delete updates[field]);

  if (updates.status && !["DRAFT", "FINAL"].includes(updates.status))
    delete updates.status;

  record.set(updates);
  record.updatedBy = req.user.id;
  await record.save();

  if (updates.status === "FINAL") {
    const completedAppointment = await Appointments.findOneAndUpdate(
      { appointmentCode: updates.appointmentId },
      {$set: {status: "Completed"} },
      { new: true },
    );
  }

  return res.status(200).json({
    success: true,
    message: `Medical record updated successfully.Appointment completed`,
    data: record,
  });
};

exports.deleteMedicalRecord = async (req, res) => {
  const { id } = req.params;
  if (!req.user.permissions?.includes("DELETE_HEALTH_RECORD")) {
    throw ERR.forbidden("Access Denied.", "DELETE_HEALTH_RECORD_FORBIDDEN");
  }

  const record = await MedicalRecord.findById(id);
  if (!record)
    throw ERR.notFound("Medical record not found.", "MEDICAL_RECORD_NOT_FOUND");
  if (record.status === "DELETED") {
    throw ERR.invalidRequest(
      "Medical record is already deleted.",
      "MEDICAL_RECORD_ALREADY_DELETED",
    );
  }

  record.status = "DELETED";
  record.updatedBy = req.user.id;
  await record.save();

  return res
    .status(200)
    .json({ success: true, message: "Successfully deleted." });
};

const getPaginatedRecords = async (req, res, baseFilter = {}) => {
  const page = Number.parseInt(req.query.page) || 1;
  const limit = Number.parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  let filter = { status: { $ne: "DELETED" }, ...baseFilter };

  if (req.query.patientId) {
    filter.patientId = req.query.patientId;
  }

  if (req.query.doctorId) {
    filter.doctorEmployeeId = req.query.doctorId;
  }

  if (req.query.date) {
    const startDate = new Date(req.query.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(req.query.date);
    endDate.setHours(23, 59, 59, 999);

    filter.visitDate = { $gte: startDate, $lte: endDate };
  }

  const [total, records] = await Promise.all([
    MedicalRecord.countDocuments(filter),
    MedicalRecord.find(filter)
      .sort({ visitDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return res.status(200).json({
    success: true,
    data: records,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

exports.getAllMedicalRecords = (req, res) => {
  return getPaginatedRecords(req, res, {});
};

exports.getMyMedicalRecords = (req, res) => {
  const employeeID = req.user?.employeeID;
  if (!employeeID) {
    throw ERR.invalidRequest(
      "No employee ID found in token.",
      "EMPLOYEE_ID_REQUIRED",
    );
  }
  return getPaginatedRecords(req, res, { doctorEmployeeId: employeeID });
};

exports.getMedicalRecordById = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.status === "DELETED") {
    throw ERR.notFound("Medical record not found.", "MEDICAL_RECORD_NOT_FOUND");
  }
  return res.status(200).json({ success: true, data: record });
};

exports.getPatientMedicalRecords = (req, res) => {
  const patientId = req.user?.patientId || req.user?.id;
  if (!patientId) {
    throw ERR.invalidRequest(
      "No patient identifier found in token.",
      "PATIENT_ID_REQUIRED",
    );
  }

  return getPaginatedRecords(req, res, { patientId });
};
