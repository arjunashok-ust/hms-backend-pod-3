const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");
const Employee = require("../models/Employee");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

//=========================================
//Get My Medical Records (PAGINATED)
//=========================================
exports.getMyMedicalRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const patient = await Patient.findOne({ email: req.user.email });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  /* Only FINAL records are released to the patient — DRAFT records may still
     be incomplete/under review by the doctor, and DELETED are always excluded. */
  const filter = { patientId: patient.UHID, status: "FINAL" };

  const totalCount = await MedicalRecord.countDocuments(filter);

  const records = await MedicalRecord.find(filter)
    .sort({ visitDate: -1 })
    .skip(skip)
    .limit(limit);

  const enrichedRecords = await Promise.all(
    records.map(async (record) => {
      const doctor = await Employee.findOne({ employeeId: record.doctorEmployeeId });

      return {
        ...record.toObject(),
        doctorName: doctor?.name || "Unknown Doctor",
        specialization: doctor?.specialization || "N/A",
      };
    })
  );

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Medical records fetched successfully", enrichedRecords, meta));
});
