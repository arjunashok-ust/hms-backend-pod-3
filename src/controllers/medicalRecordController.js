/**
 * @file medicalRecordController.js
 * @description This file contains the controller functions for creating, retrieving, updating, and deleting patient medical records.
 * @description
 * This file contains controller functions for managing patient medical records.
 *
 * @overview
 * This controller is called from a route handler after validation and permission middleware have passed.
 * It contains the core business logic for creating, reading, updating, and deleting patient medical records, with role-based access control.
 * It interacts with multiple Models to ensure data integrity. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> validate -> asyncHandler -> MEDICALRECORDCONTROLLER.JS -> [MedicalRecords, Employees, Appointments, Patients] Models
 *   MEDICALRECORDCONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const MedicalRecord = require("../models/MedicalRecords");
const Employees = require("../models/Employees");
const Appointments = require("../models/Appointments");
const Patients = require("../models/Patients");
const ERR = require("../utils/errors.utils");

/**
 * @route   POST /api/medical-records/createRecord
 * @desc    Create a new medical record.
 * @access  Private
 */
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

  if (recordStatus === "FINAL") {
    const completedAppointment = await Appointments.findOneAndUpdate(
      { appointmentCode: appointmentId },
      { $set: { status: "Completed" } },
      { new: true },
    );

    return res.status(201).json({
      success: true,
      message: `Medical record saved as ${recordStatus}.Appointment ${completedAppointment.appointmentCode} completed`,
      data: newRecord,
    });
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

/**
 * @route   PUT /api/medical-records/updateRecord/:id
 * @desc    Update an existing medical record.
 * @access  Private
 */
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
      { $set: { status: "Completed" } },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: `Medical record updated successfully. Appointment ${completedAppointment.appointmentCode} completed`,
      data: record,
    });
  }

  return res.status(200).json({
    success: true,
    message: `Medical record updated successfully. Appointment completed`,
    data: record,
  });
};

/**
 * @route   DELETE /api/medical-records/deleteRecord/:id
 * @desc    Soft delete a medical record by updating its status to 'DELETED'.
 * @access  Private
 */
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
  let page = Number.parseInt(req.query.page) || 1;
  let limit = Number.parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // Validate page and limit.
  page = !Number.isNaN(page) && page > 0 ? page : 1;
  limit = !Number.isNaN(limit) && limit > 0 ? limit : 5;
  limit = Math.min(limit, 50);

  let filter = { status: { $nin: ["DELETED"] }, ...baseFilter };

  if (req.query.patientId || baseFilter.patientId) {
    filter.patientId = req.query.patientId;
    if (baseFilter.patientId) filter.patientId = baseFilter.patientId;
    filter.status = { $nin: ["DELETED", "DRAFT"] };
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

  if (req.query.appointmentId) {
    filter.appointmentId = req.query.appointmentId;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(
      req.query.search.replaceAll(/[-\\^$*+?.()|[\]{}]/g, String.raw`\$&`),
      "i",
    );
    const searchFilter = {
      $or: [{ recordCode: searchRegex }, { "doctorInfo.name": searchRegex }],
    };

    filter = { $and: [filter, searchFilter] };
  }

  const aggregationPipeline = [
    {
      $lookup: {
        from: "employees",
        localField: "doctorEmployeeId",
        foreignField: "employeeCode",
        as: "doctorInfo",
      },
    },
    { $match: filter },
    { $sort: { visitDate: -1, createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "patients",
              localField: "patientId",
              foreignField: "UHID",
              as: "patientInfo",
            },
          },
          {
            $addFields: {
              doctorName: { $arrayElemAt: ["$doctorInfo.name", 0] },
              patientName: { $arrayElemAt: ["$patientInfo.name", 0] },
            },
          },
          {
            $project: {
              doctorInfo: 0,
              patientInfo: 0,
            },
          },
        ],
      },
    },
  ];

  const results = await MedicalRecord.aggregate(aggregationPipeline);

  const records = results[0].data;
  const total = results[0].metadata[0] ? results[0].metadata[0].total : 0;

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

/**
 * @route   GET /api/medical-records/getAllRecords
 * @desc    Get all medical records with pagination and filtering (for admins).
 * @access  Private
 */
exports.getAllMedicalRecords = (req, res) => {
  return getPaginatedRecords(req, res, {});
};

/**
 * @route   GET /api/medical-records/getMyRecords
 * @desc    Get all medical records created by the currently authenticated doctor.
 * @access  Private
 */
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

/**
 * @route   GET /api/medical-records/getRecord/:id
 * @desc    Get a single medical record by its ID.
 * @access  Private
 */
exports.getMedicalRecordById = async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  if (!record || record.status === "DELETED") {
    throw ERR.notFound("Medical record not found.", "MEDICAL_RECORD_NOT_FOUND");
  }
  return res.status(200).json({ success: true, data: record });
};

/**
 * @route   GET /api/medical-records/getPatientRecords
 * @desc    Get all medical records for the currently authenticated patient.
 * @access  Private
 */
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
