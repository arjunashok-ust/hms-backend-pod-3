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
      createdBy: req.user.employeeID,
      updatedBy: req.user.employeeID,
    });

    return res.status(201).json({
      success: true,
      message: `Medical record saved as ${recordStatus}.`,
      data: newRecord,
    });
  } catch (error) {
    console.error(error);
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

    if (record.status === 'FINAL'){
      return res
      .status(409)
      .json({success: false,
        message: "Cannot edit finalized record"
      })
    }

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

    return res.status(200).json({
      success: true,
      message: `Medical record updated successfully.`,
      data: record,
    });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// --- Helper function for server-side filtering & pagination ---
const getPaginatedRecords = async (req, res, baseFilter = {}) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 1. Build dynamic filter
    let filter = { status: { $ne: "DELETED" }, ...baseFilter };

    // Explicitly check for exact matches if query params exist
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

      // Target the default visitDate field from your schema
      filter.visitDate = { $gte: startDate, $lte: endDate };
    }

    // 2. Execute Count and Find concurrently
    const [total, records] = await Promise.all([
      MedicalRecord.countDocuments(filter),
      MedicalRecord.find(filter)
        .sort({ visitDate: -1, createdAt: -1 }) // Primary sort by visit date
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
  } catch (error) {
    console.error("Pagination Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// ==========================================
// 4. FETCH ALL RECORDS (Admin / Reception)
// ==========================================
exports.getAllMedicalRecords = (req, res) => {
  return getPaginatedRecords(req, res, {});
};

// ==========================================
// 5. FETCH DOCTOR'S RECORDS (Doctors)
// ==========================================
exports.getMyMedicalRecords = (req, res) => {
  const employeeID = req.user?.employeeID;
  if (!employeeID) {
    return res
      .status(400)
      .json({ success: false, message: "No employee ID found in token." });
  }
  // Hard-lock the query to this doctor's ID
  return getPaginatedRecords(req, res, { doctorEmployeeId: employeeID });
};

exports.getMedicalRecordById = async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record || record.status === "DELETED")
      return res.status(404).json({ success: false, message: "Not found." });
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
