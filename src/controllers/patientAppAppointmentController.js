const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

//======================================
//Create Appointment (Patient)
//======================================
exports.createPatientAppointment = asyncHandler(async (req, res) => {
  const { doctorEmployeeId, date, timeSlot } = req.body;

  const patient = await Patient.findOne({ email: req.user.email });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  const existingAppointment = await Appointment.findOne({
    doctorEmployeeId,
    date,
    timeSlot,
    status: { $in: ["PENDING", "BOOKED"] },
  });

  if (existingAppointment) {
    throw new ApiError(409, "Slot Already Booked", "SLOT_CONFLICT");
  }

 
  const patientConflict = await Appointment.findOne({
    patientId: patient.UHID,
    date,
    timeSlot,
    status: { $in: ["PENDING", "BOOKED"] },
  });

  if (patientConflict) {
    throw new ApiError(
      409,
      "You already have an appointment booked at this time.",
      "PATIENT_SLOT_CONFLICT"
    );
  }

  const doctor = await Employee.findOne({
    employeeId: doctorEmployeeId,
    status: true,
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor Not Found", "DOCTOR_NOT_FOUND");
  }

  const appointment = await Appointment.create({
    patientId: patient.UHID,
    doctorEmployeeId,
    date,
    timeSlot,
    status: "PENDING",
    createdByEmployeeId: patient.UHID,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Appointment Created Successfully", { appointment }));
});

//=========================
//Get Appointments (PAGINATED)
//===========================
exports.getPatientAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const patient = await Patient.findOne({ email: req.user.email }).select("UHID").lean();
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  const filter = { patientId: patient.UHID };
  if (req.query.status) filter.status = req.query.status;

  const totalCount = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  /* Batch-fetch the referenced doctors in ONE query (avoids a findOne per row). */
  const doctorIds = [...new Set(appointments.map((a) => a.doctorEmployeeId).filter(Boolean))];
  const doctors = await Employee.find({ employeeId: { $in: doctorIds } })
    .select("employeeId name specialization")
    .lean();
  const doctorMap = new Map(doctors.map((d) => [d.employeeId, d]));

  const enrichedAppointments = appointments.map((appointment) => {
    const doctor = doctorMap.get(appointment.doctorEmployeeId);
    return {
      ...appointment,
      doctorName: doctor?.name || "Unknown Doctor",
      specialization: doctor?.specialization || "N/A",
    };
  });

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Patient appointments fetched successfully", enrichedAppointments, meta)
    );
});

//=================================
//Cancel Appointment
//=================================
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ email: req.user.email });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  const appointment = await Appointment.findOne({
    appointmentId: req.params.id,
    patientId: patient.UHID,
  });

  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }

  if (appointment.status === "CANCELLED") {
    throw new ApiError(400, "Appointment Already Cancelled", "ALREADY_CANCELLED");
  }

  if (appointment.status === "COMPLETED") {
    throw new ApiError(
      400,
      "Completed Appointment Cannot Be Cancelled",
      "INVALID_STATUS_TRANSITION"
    );
  }

  appointment.status = "CANCELLED";
  await appointment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Appointment Cancelled Successfully", { appointment }));
});

//=================================
//Get Available Slots
//=================================
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorEmployeeId, date } = req.params;

  const doctor = await Employee.findOne({
    employeeId: doctorEmployeeId,
    status: true,
  });

  if (!doctor) {
    throw new ApiError(404, "Doctor Not Found", "DOCTOR_NOT_FOUND");
  }

  const selectedDate = new Date(date);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const bookedAppointments = await Appointment.find({
    doctorEmployeeId,
    date: { $gte: selectedDate, $lt: nextDate },
    status: { $in: ["PENDING", "BOOKED"] },
  });

  const bookedSlots = new Set(
    bookedAppointments.map((appointment) => appointment.timeSlot)
  );

  const availableSlots = doctor.availabilitySlots.filter(
    (slot) => !bookedSlots.has(slot)
  );

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  let finalSlots = availableSlots;

  if (isToday) {
    finalSlots = availableSlots.filter((slot) => {
      const endTime = slot.split(" - ")[1];
      const [time, period] = endTime.split(" ");
      let [hours, minutes] = time.split(":").map(Number);

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      const slotEnd = new Date();
      slotEnd.setHours(hours, minutes, 0, 0);

      return slotEnd > today;
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Available slots fetched successfully", { slots: finalSlots }));
});
