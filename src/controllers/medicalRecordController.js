const MedicalRecord = require("../models/MedicalRecords");
const Employees = require("../models/Employees");
const Appointments = require("../models/Appointments");
const Patients = require("../models/Patients");

// ==========================================
// 1. CREATE RECORD
// ==========================================
exports.createMedicalRecord = async (req, res) => {
  try {
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
      return res.status(400).json({
        success: false,
        message: "doctorEmployeeId, appointmentId, and patientId are required.",
      });
    }

    // --- DATABASE EXISTENCE CHECKS ---
    const doctorExists = await Employees.findOne({
      employeeCode: doctorEmployeeId,
    });
    if (!doctorExists) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found in the database." });
    }

    const patientExists = await Patients.findOne({ UHID: patientId });
    if (!patientExists) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Patient not found in the database.",
        });
    }

    const appointmentExists = await Appointments.findOne({
      appointmentCode: appointmentId,
    });
    if (!appointmentExists) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Appointment not found in the database.",
        });
    }
    // ---------------------------------

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
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: `Medical record successfully saved as ${recordStatus}.`,
      data: newRecord,
    });
  } catch (error) {
    console.error("Create Medical Record Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


// ==========================================
// 3. UPDATE RECORD
// ==========================================

const validateUpdatePermissions = (record, userPermissions) => {
  if (record.status === "DELETED") {
    return { status: 400, message: "Cannot update a deleted record." };
  }
  
  const canUpdateFinalized = userPermissions.includes("UPDATE_FINALISED_RECORD");
  if (record.status === "FINAL" && !canUpdateFinalized) {
    return {
      status: 403,
      message: "Access Denied: This medical record is marked as FINAL. You lack the permission to edit finalized records.",
      errorCode: "FORBIDDEN",
    };
  }
  return null;
};

const validateCriticalFieldPermissions = (updates, record, userPermissions) => {
  const attemptingCriticalUpdate =
    (updates.doctorEmployeeId && updates.doctorEmployeeId !== record.doctorEmployeeId) ||
    (updates.patientId && updates.patientId !== record.patientId) ||
    (updates.appointmentId && updates.appointmentId !== record.appointmentId);

  if (attemptingCriticalUpdate && !userPermissions.includes("UPDATE_CRITICAL_RECORD_FIELDS")) {
    return {
      status: 403,
      message: "Access Denied: You lack the 'UPDATE_CRITICAL_RECORD_FIELDS' permission required to reassign the Patient, Doctor, or Appointment ID.",
      errorCode: "FORBIDDEN",
    };
  }
  return null;
};

const validateForeignKeys = async (updates, record) => {
  if (updates.doctorEmployeeId && updates.doctorEmployeeId !== record.doctorEmployeeId) {
    const exists = await Employees.exists({ employeeCode: updates.doctorEmployeeId });
    if (!exists) return "New Doctor ID not found in database.";
  }
  if (updates.patientId && updates.patientId !== record.patientId) {
    const exists = await Patients.exists({ UHID: updates.patientId });
    if (!exists) return "New Patient ID not found in database.";
  }
  if (updates.appointmentId && updates.appointmentId !== record.appointmentId) {
    const exists = await Appointments.exists({ appointmentCode: updates.appointmentId });
    if (!exists) return "New Appointment ID not found in database.";
  }
  return null;
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const userPermissions = req.user.permissions || [];

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Medical record not found." });
    }

    const permissionError = validateUpdatePermissions(record, userPermissions);
    if (permissionError) {
      return res.status(permissionError.status).json({
        success: false,
        message: permissionError.message,
        errorCode: permissionError.errorCode,
      });
    }

    const criticalFieldError = validateCriticalFieldPermissions(updates, record, userPermissions);
    if (criticalFieldError) {
      return res.status(criticalFieldError.status).json({
        success: false,
        message: criticalFieldError.message,
        errorCode: criticalFieldError.errorCode,
      });
    }

    const fkError = await validateForeignKeys(updates, record);
    if (fkError) {
      return res.status(404).json({ success: false, message: fkError });
    }

    const protectedFields = ["_id", "recordCode", "createdBy", "createdAt"];
    protectedFields.forEach((field) => delete updates[field]);

    if (updates.status && !["DRAFT", "FINAL"].includes(updates.status)) {
      delete updates.status; 
    }

    record.set(updates);
    record.updatedBy = req.user.id;

    await record.save();

    return res.status(200).json({
      success: true,
      message: `Medical record updated successfully. Current status: ${record.status}`,
      data: record,
    });
  } catch (error) {
    console.error("Update Medical Record Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 3. DELETE RECORD
// ==========================================
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const userPermissions = req.user.permissions || [];
    const canDelete = userPermissions.includes("DELETE_HEALTH_RECORD");

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "Access Denied: You lack the permission to delete medical records.",
        errorCode: "FORBIDDEN",
      });
    }

    const record = await MedicalRecord.findById(id);

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Medical record not found." });
    }

    if (record.status === "DELETED") {
      return res
        .status(400)
        .json({ success: false, message: "Record is already deleted." });
    }

    record.status = "DELETED";
    record.updatedBy = req.user.id;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Medical record successfully deleted.",
    });
  } catch (error) {
    console.error("Delete Medical Record Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 4. FETCH ALL RECORDS (Universal Filter)
// ==========================================
/**
 * Universal GET endpoint. Accepts query parameters:
 * ?patientId=123 & ?doctorEmployeeId=456 & ?appointmentId=789 & ?date=2026-06-18
 */
exports.getMedicalRecords = async (req, res) => {
  try {
    const { patientId, doctorEmployeeId, appointmentId, date } = req.query;

    // Default filter: Do not return soft-deleted records
    let filter = { status: { $ne: "DELETED" } };

    if (patientId) filter.patientId = patientId;
    if (doctorEmployeeId) filter.doctorEmployeeId = doctorEmployeeId;
    if (appointmentId) filter.appointmentId = appointmentId;

    if (date) {
      // Create a date range to capture the entire day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      filter.visitDate = { $gte: startDate, $lte: endDate };
    }

    // Sort by newest first
    const records = await MedicalRecord.find(filter).sort({ visitDate: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Fetch Medical Records Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 5. FETCH SINGLE RECORD BY ID
// ==========================================
exports.getMedicalRecordById = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findById(id);

    if (!record || record.status === "DELETED") {
      return res
        .status(404)
        .json({ success: false, message: "Medical record not found." });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    console.error("Fetch Single Medical Record Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
