const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

/* ================================
   CREATE APPOINTMENT
   ================================ */
exports.createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorEmployeeId, date, timeSlot, status } = req.body;

  /* CHECK PATIENT */
  const patient = await Patient.findOne({ UHID: patientId });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  /* CHECK DOCTOR */
  const doctor = await Employee.findOne({
    employeeId: doctorEmployeeId,
    status: true,
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor Not Found", "DOCTOR_NOT_FOUND");
  }

  /* CHECK SLOT */
  const existingAppointment = await Appointment.findOne({
    doctorEmployeeId,
    date,
    timeSlot,
    status: "BOOKED",
  });

  if (existingAppointment) {
    throw new ApiError(409, "Slot Already Booked", "SLOT_CONFLICT");
  }

  /* CREATE */
  const appointment = await Appointment.create({
    patientId,
    doctorEmployeeId,
    date,
    timeSlot,
    status: status || "BOOKED",
    createdByEmployeeId: req.user?.employeeId || null,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Appointment Created Successfully", { appointment }));
});

/* ================================
   GET ALL APPOINTMENTS (PAGINATED)
================================ */
exports.getAllAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  let filter = {};

  // DOCTOR -> ONLY OWN APPOINTMENTS
  if (req.user.role === "doctor") {
    const doctorUser = await User.findById(req.user.id);
    filter = { doctorEmployeeId: doctorUser.employeeId };
  }

  // OPTIONAL STATUS FILTER (?status=BOOKED)
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const totalCount = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const enrichedAppointments = await Promise.all(
    appointments.map(async (appointment) => {
      const doctor = await Employee.findOne({
        employeeId: appointment.doctorEmployeeId,
      });

      const patient = await Patient.findOne({
        UHID: appointment.patientId,
      });

      return {
        ...appointment.toObject(),
        doctorName: doctor?.name || "Unknown Doctor",
        specialization: doctor?.specialization || "N/A",
        patientName: patient?.name || "Unknown Patient",
      };
    })
  );

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointments fetched successfully", enrichedAppointments, meta));
});

/* ================================
   APPOINTMENT UI STATS
================================ */
exports.getAppointmentUI = asyncHandler(async (req, res) => {
  let filter = {};

  // DOCTOR -> ONLY HIS APPOINTMENTS
  if (req.user.role === "doctor") {
    const doctorUser = await User.findById(req.user.id);
    filter = { doctorEmployeeId: doctorUser.employeeId };
  }

  const totalAppointments = await Appointment.countDocuments(filter);

  const bookedAppointments = await Appointment.countDocuments({
    ...filter,
    status: "BOOKED",
  });

  const cancelledAppointments = await Appointment.countDocuments({
    ...filter,
    status: "CANCELLED",
  });

  const completedAppointments = await Appointment.countDocuments({
    ...filter,
    status: "COMPLETED",
  });

  return res.status(200).json(
    new ApiResponse(200, "Appointment stats fetched successfully", {
      totalAppointments,
      bookedAppointments,
      cancelledAppointments,
      completedAppointments,
    })
  );
});

/* ================================
   DELETE APPOINTMENT
================================ */
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }

  await appointment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Deleted Successfully"));
});

/* ================================
   GET DOCTORS (PAGINATED)
================================ */
exports.getDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const doctorUsers = await User.find({
    role: "doctor",
    status: true,
  });

  const employeeIds = doctorUsers.map((doctor) => doctor.employeeId);

  const totalCount = await Employee.countDocuments({
    employeeId: { $in: employeeIds },
    status: true,
  });

  const doctors = await Employee.find({
    employeeId: { $in: employeeIds },
    status: true,
  })
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Doctors fetched successfully", doctors, meta));
});

/* ===========================================
   APPROVE APPOINTMENT FOR PATIENT BOOKING
============================================ */
exports.approveAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }

  appointment.status = "BOOKED";
  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Approved Successfully", { appointment }));
});

/* ===================================
   REJECT OR CANCEL APPOINTMENT
=================================== */
exports.rejectAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findOne({ appointmentId });

  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }

  appointment.status = "CANCELLED";
  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Rejected", { appointment }));
});


/* ================================
   UPDATE APPOINTMENT
   ================================ */
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { doctorEmployeeId, date, timeSlot, status } = req.body;

  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }

  /* IF DOCTOR IS BEING CHANGED, VALIDATE NEW DOCTOR */
  if (doctorEmployeeId && doctorEmployeeId !== appointment.doctorEmployeeId) {
    const doctor = await Employee.findOne({
      employeeId: doctorEmployeeId,
      status: true,
    });

    if (!doctor) {
      throw new ApiError(404, "Doctor Not Found", "DOCTOR_NOT_FOUND");
    }
  }

  /* IF DATE/TIME/DOCTOR CHANGING, CHECK SLOT CONFLICT */
  const newDoctorId = doctorEmployeeId || appointment.doctorEmployeeId;
  const newDate = date || appointment.date;
  const newTimeSlot = timeSlot || appointment.timeSlot;

  const isSlotChanging =
    newDoctorId !== appointment.doctorEmployeeId ||
    newDate !== appointment.date ||
    newTimeSlot !== appointment.timeSlot;

  if (isSlotChanging) {
    const conflictingAppointment = await Appointment.findOne({
      appointmentId: { $ne: appointmentId },
      doctorEmployeeId: newDoctorId,
      date: newDate,
      timeSlot: newTimeSlot,
      status: "BOOKED",
    });

    if (conflictingAppointment) {
      throw new ApiError(409, "Slot Already Booked", "SLOT_CONFLICT");
    }
  }

  /* APPLY UPDATES */
  if (doctorEmployeeId) appointment.doctorEmployeeId = doctorEmployeeId;
  if (date) appointment.date = date;
  if (timeSlot) appointment.timeSlot = timeSlot;
  if (status) appointment.status = status;

  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Updated Successfully", { appointment }));
});