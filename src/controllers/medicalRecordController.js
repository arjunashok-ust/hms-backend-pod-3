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
      return res
        .status(400)
        .json({
          success: false,
          message:
            "doctorEmployeeId, appointmentId, and patientId are required.",
        });
    }

    const doctorExists = await Employees.findOne({
      employeeCode: doctorEmployeeId,
    });
    if (!doctorExists)
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found." });

    const patientExists = await Patients.findOne({ UHID: patientId });
    if (!patientExists)
      return res
        .status(404)
        .json({ success: false, message: "Patient not found." });

    const appointmentExists = await Appointments.findOne({
      appointmentCode: appointmentId,
    });
    if (!appointmentExists)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found." });

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

    return res
      .status(201)
      .json({
        success: true,
        message: `Medical record saved as ${recordStatus}.`,
        data: newRecord,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 2. UPDATE RECORD
// ==========================================
const validateUpdatePermissions = (record, userPermissions) => {
  if (record.status === "DELETED")
    return { status: 400, message: "Cannot update a deleted record." };

  const canUpdateFinalized = userPermissions.includes(
    "UPDATE_FINALISED_RECORD",
  );
  if (record.status === "FINAL" && !canUpdateFinalized) {
    return {
      status: 403,
      message:
        "Access Denied: Record is FINAL. You lack permission to edit finalized records.",
      errorCode: "FORBIDDEN",
    };
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
    return {
      status: 403,
      message:
        "Access Denied: You lack 'UPDATE_CRITICAL_RECORD_FIELDS' permission.",
      errorCode: "FORBIDDEN",
    };
  }
  return null;
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    const userPermissions = req.user.permissions || [];

    const record = await MedicalRecord.findById(id);
    if (!record)
      return res
        .status(404)
        .json({ success: false, message: "Medical record not found." });

    const permissionError = validateUpdatePermissions(record, userPermissions);
    if (permissionError)
      return res
        .status(permissionError.status)
        .json({ success: false, message: permissionError.message });

    const criticalFieldError = validateCriticalFieldPermissions(
      updates,
      record,
      userPermissions,
    );
    if (criticalFieldError)
      return res
        .status(criticalFieldError.status)
        .json({ success: false, message: criticalFieldError.message });

    const protectedFields = ["_id", "recordCode", "createdBy", "createdAt"];
    protectedFields.forEach((field) => delete updates[field]);

    if (updates.status && !["DRAFT", "FINAL"].includes(updates.status))
      delete updates.status;

    record.set(updates);
    record.updatedBy = req.user.id;
    await record.save();

    return res
      .status(200)
      .json({
        success: true,
        message: `Medical record updated successfully.`,
        data: record,
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 3. DELETE RECORD
// ==========================================
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user.permissions?.includes("DELETE_HEALTH_RECORD")) {
      return res
        .status(403)
        .json({ success: false, message: "Access Denied." });
    }

    const record = await MedicalRecord.findById(id);
    if (!record)
      return res.status(404).json({ success: false, message: "Not found." });
    if (record.status === "DELETED")
      return res
        .status(400)
        .json({ success: false, message: "Already deleted." });

    record.status = "DELETED";
    record.updatedBy = req.user.id;
    await record.save();

    return res
      .status(200)
      .json({ success: true, message: "Successfully deleted." });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 4. FETCH ALL RECORDS (Admin / Reception)
// ==========================================
exports.getAllMedicalRecords = async (req, res) => {
  try {
    const records = await MedicalRecord.find({
      status: { $ne: "DELETED" },
    }).sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error("Fetch All Medical Records Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 5. FETCH DOCTOR'S RECORDS (Doctors)
// ==========================================
exports.getMyMedicalRecords = async (req, res) => {
  try {
    const employeeID = req.user?.employeeID; // Extracts the doctor's ID from the JWT token
    if (!employeeID)
      return res
        .status(400)
        .json({ success: false, message: "No employee ID found in token." });

    const records = await MedicalRecord.find({
      doctorEmployeeId: employeeID,
      status: { $ne: "DELETED" },
    }).sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ success: true, count: records.length, data: records });
  } catch (error) {
    console.error("Fetch My Medical Records Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

exports.getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record || record.status === "DELETED")
      return res.status(404).json({ success: false, message: "Not found." });
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
