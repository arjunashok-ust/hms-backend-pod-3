const MedicalRecord = require("../models/MedicalRecord");
const Role = require("../models/Role");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const PERMISSIONS = require("../constants/permissions");

const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

/* Combines an appointment's date with the START time of its timeSlot
   (e.g. "12:00 PM - 12:30 PM" -> 12:00) into a single Date, so we can tell
   whether the visit has actually begun. Dates are stored at midnight UTC, so
   the calendar day is read in UTC and the clock time applied in server-local
   time. Returns null if the slot string can't be parsed. */
const getSlotStartDateTime = (appointmentDate, timeSlot) => {
  if (!appointmentDate || !timeSlot) return null;

  const startStr = String(timeSlot).split(" - ")[0]?.trim();
  const [time, period] = (startStr || "").split(" ");
  if (!time || !period) return null;

  let [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

  const d = new Date(appointmentDate);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), hours, minutes, 0, 0);
};

/* CREATE — validates required fields + that the visit has actually started. */
exports.createMedicalRecord = async ({
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
  userId,
}) => {
  if (!doctorEmployeeId || !appointmentId || !patientId) {
    throw new ApiError(
      400,
      "doctorEmployeeId, appointmentId, and patientId are required.",
      "VALIDATION_ERROR"
    );
  }

  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new ApiError(404, "Appointment not found for this medical record.", "APPOINTMENT_NOT_FOUND");
  }

  const slotStart = getSlotStartDateTime(appointment.date, appointment.timeSlot);
  if (slotStart && Date.now() < slotStart.getTime()) {
    throw new ApiError(
      400,
      "This appointment hasn't started yet. A medical record can only be created on or after the appointment's start time.",
      "APPOINTMENT_NOT_STARTED"
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
    createdBy: userId,
    updatedBy: userId,
  });

  await newRecord.save();
  return newRecord;
};

/* READ (paginated + enriched). Doctors are scoped to their own records. */
exports.getMedicalRecords = async ({ query, user }) => {
  const { page, limit, skip } = getPagination(query);

  const filter = { status: { $ne: "DELETED" } };
  if (query.patientId) filter.patientId = query.patientId;
  if (query.doctorEmployeeId) filter.doctorEmployeeId = query.doctorEmployeeId;
  if (query.appointmentId) filter.appointmentId = query.appointmentId;
  if (query.status) filter.status = query.status;

  /* DOCTORS ONLY SEE THEIR OWN RECORDS — overrides any doctorEmployeeId param. */
  if (user.role === "doctor") {
    const doctorUser = await User.findById(user.id);
    filter.doctorEmployeeId = doctorUser.employeeId;
  }

  const totalCount = await MedicalRecord.countDocuments(filter);

  const records = await MedicalRecord.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  /* Enrich with doctor/patient names even if since-deactivated. */
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
  return { records: enrichedRecords, meta };
};

/* UPDATE — enforces FINAL-record permission + doctor ownership. */
exports.updateMedicalRecord = async ({ id, updates, user }) => {
  const record = await MedicalRecord.findById(id);
  if (!record) {
    throw new ApiError(404, "Medical record not found.", "RECORD_NOT_FOUND");
  }

  if (record.status === "DELETED") {
    throw new ApiError(400, "Cannot update a deleted record.", "RECORD_DELETED");
  }

  /* Editing a FINAL record needs a stronger permission (state-dependent). */
  if (record.status === "FINAL") {
    const roleDoc = await Role.findOne({ role_name: user.role }).select("role_permissions");
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

  /* Doctors can only edit their own records (ownership, not a static guard). */
  if (user.role === "doctor") {
    const requestingUser = await User.findById(user.id);
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

  record.updatedBy = user.id;
  await record.save();
  return record;
};

/* DELETE (soft) — sets status to DELETED. */
exports.deleteMedicalRecord = async ({ id, userId }) => {
  const record = await MedicalRecord.findById(id);
  if (!record) {
    throw new ApiError(404, "Medical record not found.", "RECORD_NOT_FOUND");
  }

  if (record.status === "DELETED") {
    throw new ApiError(400, "Record is already deleted.", "RECORD_DELETED");
  }

  record.status = "DELETED";
  record.updatedBy = userId;
  await record.save();
  return record;
};
