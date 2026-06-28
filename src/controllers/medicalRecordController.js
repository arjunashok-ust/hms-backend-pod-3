const medicalRecordService = require("../services/medicalRecord.service");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// Create Medical Record
exports.createMedicalRecord = asyncHandler(async (req, res) => {
  const record = await medicalRecordService.createMedicalRecord({
    ...req.body,
    userId: req.user.id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        `Medical record successfully saved as ${record.status}.`,
        { record }
      )
    );
});

// Get Medical Records (paginated)
exports.getMedicalRecords = asyncHandler(async (req, res) => {
  const { records, meta } = await medicalRecordService.getMedicalRecords({
    query: req.query,
    user: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Medical records fetched successfully", records, meta));
});

// Update Medical Record
exports.updateMedicalRecord = asyncHandler(async (req, res) => {
  const record = await medicalRecordService.updateMedicalRecord({
    id: req.params.id,
    updates: req.body,
    user: req.user,
  });

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

// Delete Medical Record (soft delete)
exports.deleteMedicalRecord = asyncHandler(async (req, res) => {
  await medicalRecordService.deleteMedicalRecord({
    id: req.params.id,
    userId: req.user.id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Medical record successfully deleted."));
});
