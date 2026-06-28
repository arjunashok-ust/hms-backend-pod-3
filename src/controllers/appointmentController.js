const appointmentService = require("../services/appointment.service");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

// CREATE
exports.createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointment({
    ...req.body,
    createdByEmployeeId: req.user?.employeeId || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Appointment Created Successfully", { appointment }));
});

// READ (paginated)
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const { appointments, meta } = await appointmentService.getAllAppointments({
    query: req.query,
    user: req.user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointments fetched successfully", appointments, meta));
});

// UI STATS
exports.getAppointmentUI = asyncHandler(async (req, res) => {
  const stats = await appointmentService.getAppointmentStats({ user: req.user });

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment stats fetched successfully", stats));
});

// DELETE
exports.deleteAppointment = asyncHandler(async (req, res) => {
  await appointmentService.deleteAppointment({ appointmentId: req.params.appointmentId });

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Deleted Successfully"));
});

// DOCTORS (paginated)
exports.getDoctors = asyncHandler(async (req, res) => {
  const { doctors, meta } = await appointmentService.getDoctors({ query: req.query });

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctors fetched successfully", doctors, meta));
});

// APPROVE (-> BOOKED)
exports.approveAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.approveAppointment({
    appointmentId: req.params.appointmentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Approved Successfully", { appointment }));
});

// REJECT (-> CANCELLED)
exports.rejectAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.rejectAppointment({
    appointmentId: req.params.appointmentId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Rejected", { appointment }));
});

// UPDATE
exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointment({
    appointmentId: req.params.appointmentId,
    updates: req.body,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Updated Successfully", { appointment }));
});
