/**
 * @file appointmentController.js
 * @description
 * This file contains the controller functions for managing appointment-related operations.
 * It handles the logic for creating, retrieving, updating, and deleting appointments.
 *
 * @overview
 * The controller acts as the intermediary between the API routes and the database models.
 * It is called from a route handler after all preceding middleware have passed. It contains the core business logic for each endpoint.
 * It interacts with Mongoose Models to perform database operations. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> Middlewares -> APPOINTMENTCONTROLLER.JS -> [Appointments, Employees, Users, Patients] Models
 *   APPOINTMENTCONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const jwt = require("jsonwebtoken");
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");
const Patients = require("../models/Patients");
const ERR = require("../utils/errors.utils");

/**
 * @route   GET /api/appointments/stats
 * @desc    Get appointment statistics for the current user (Admin, Doctor, or Patient).
 * @access  Private
 */
exports.getAppointmentStats = async (req, res) => {
  const userRole = req.user?.role?.toUpperCase();
  const employeeID = req.user?.employeeID;

  // Build the dynamic match stage based on who is asking
  let matchStage = {};
  if (userRole === "DOCTOR") {
    matchStage = { doctorEmployeeID: employeeID };
  } else if (userRole === "PATIENT") {
    matchStage = { patientId: req.user.UHID };
  }

  const total = await Appointments.countDocuments(matchStage);
  const completed = await Appointments.countDocuments({
    ...matchStage,
    status: "Completed",
  });
  const booked = await Appointments.countDocuments({
    ...matchStage,
    status: "Scheduled",
  });
  const cancelled = await Appointments.countDocuments({
    ...matchStage,
    status: "Cancelled",
  });

  const pending = await Appointments.countDocuments({
    ...matchStage,
    status: { $regex: /^pending$/i },
  });

  res.status(200).json({ total, completed, booked, cancelled, pending });
};

/**
 * @route   GET /api/appointments/recent
 * @desc    Get recent appointments with pagination for the current user.
 * @access  Private
 */
exports.getRecentAppointments = async (req, res) => {
  const userRole = req.user?.role?.toUpperCase();
  const employeeID = req.user?.employeeID;

  let page = Number.parseInt(req.query.page, 10);
  let limit = Number.parseInt(req.query.limit, 10);

  // Validate page and limit, providing sensible defaults and constraints.
  page = !Number.isNaN(page) && page > 0 ? page : 1;
  limit = !Number.isNaN(limit) && limit > 0 ? limit : 5;
  limit = Math.min(limit, 50); // Enforce a maximum limit to prevent abuse

  const skip = (page - 1) * limit;

  let matchStage = { status: { $ne: "Deleted" } };
  if (userRole === "DOCTOR") {
    matchStage = { doctorEmployeeID: employeeID };
  } else if (userRole === "PATIENT") {
    matchStage = { patientId: req.user.UHID };
  }

  const appointments = await Appointments.aggregate([
    { $match: matchStage },
    { $sort: { date: 1, timeSlot: 1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "employees",
              localField: "doctorEmployeeID",
              foreignField: "employeeCode",
              as: "doctorInfo",
            },
          },
          {
            $lookup: {
              from: "employees",
              localField: "createdByEmployeeID",
              foreignField: "employeeCode",
              as: "creatorInfo",
            },
          },
          {
            $project: {
              appointmentCode: 1,
              patientId: 1,
              doctorEmployeeID: 1,
              date: 1,
              timeSlot: 1,
              status: 1,
              doctorName: { $arrayElemAt: ["$doctorInfo.name", 0] },
              doctorDept: { $arrayElemAt: ["$doctorInfo.department", 0] },
              creatorName: { $arrayElemAt: ["$creatorInfo.name", 0] },
            },
          },
        ],
      },
    },
  ]);

  const total = appointments[0].metadata[0]
    ? appointments[0].metadata[0].total
    : 0;
  const data = appointments[0].data;

  res.status(200).json({
    success: true,
    data: data,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

/**
 * @route   GET /api/appointments/doctors
 * @desc    Get a list of all employees with the 'DOCTOR' role.
 * @access  Private
 */
exports.getDoctorsList = async (req, res) => {
  const doctors = await Users.aggregate([
    { $match: { role: "DOCTOR" } },
    {
      $lookup: {
        from: "employees",
        localField: "employeeID",
        foreignField: "employeeCode",
        as: "profile",
      },
    },
    { $unwind: "$profile" },
    {
      $project: {
        employeeCode: "$profile.employeeCode",
        name: "$profile.name",
        department: "$profile.department",
        status: "$profile.status",
        designation: "$profile.designation",
        specialization: "$profile.specialization",
      },
    },
  ]);

  res.status(200).json(doctors);
};

const normalizeToUTCWithoutTime = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
  );
};

/**
 * @route   GET /api/appointments/slots
 * @desc    Get available appointment slots for a specific doctor on a given date.
 * @access  Private
 */
exports.getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    throw ERR.invalidDoctorAndDate();
  }

  const dateObj = normalizeToUTCWithoutTime(date);

  const daysOfWeek = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const targetDay = daysOfWeek[dateObj.getUTCDay()];

  const doctor = await Employees.findOne({ employeeCode: doctorId });
  if (!doctor) {
    throw new NotFoundError("Doctor not found", { doctorId });
  }

  const dailySchedule = doctor.weeklySchedule.find(
    (s) => s.dayOfWeek === targetDay,
  );
  if (!dailySchedule?.slots || dailySchedule.slots.length === 0) {
    return res.status(200).json([]);
  }

  const allPossibleSlots = dailySchedule.slots.map(
    (s) => `${s.startTime} - ${s.endTime}`,
  );

  const existingAppointments = await Appointments.find({
    doctorEmployeeID: doctorId,
    date: dateObj,
    status: { $in: ["Scheduled", "Pending"] },
  });

  const bookedSlots = new Set(existingAppointments.map((apt) => apt.timeSlot));
  const availableSlots = allPossibleSlots.filter(
    (slot) => !bookedSlots.has(slot),
  );

  res.status(200).json(availableSlots);
};

/**
 * @route   POST /api/appointments/create
 * @desc    Create a new appointment.
 * @access  Private
 */
exports.addAppointment = async (req, res) => {
  const { patientId, doctorEmployeeID, date, timeSlot } = req.body;
  const userRole = req.user?.role;

  if (!patientId || !doctorEmployeeID || !date || !timeSlot) {
    throw ERR.missingAppointmentFields();
  }

  const doctor = await Employees.findOne({ employeeCode: doctorEmployeeID });
  if (!doctor) {
    throw ERR.doctorNotFound();
  }

  const exactDate = normalizeToUTCWithoutTime(date);

  const patientConflict = await Appointments.findOne({
    patientId: patientId,
    date: exactDate,
    timeSlot: timeSlot,
    status: { $in: ["Scheduled", "Pending"] },
  });

  if (patientConflict) {
    throw ERR.existingPatientAppointment();
  }

  const doctorConflictCount = await Appointments.countDocuments({
    doctorEmployeeID: doctorEmployeeID,
    date: exactDate,
    timeSlot: timeSlot,
    status: { $in: ["Scheduled", "Pending"] },
  });

  if (doctorConflictCount > 0) {
    throw ERR.existingSlot();
  }

  const status =
    userRole === "PATIENT" ? "Pending" : req.body.status || "Scheduled";
  const createdByEmployeeID =
    userRole === "PATIENT" ? null : req.user.employeeID;

  const newAppointment = await Appointments.create({
    patientId,
    doctorEmployeeID,
    date: exactDate,
    timeSlot,
    status,
    createdByEmployeeID,
  });

  return res.status(201).json({
    message: "Appointment requested successfully.",
    newAppointment,
  });
};

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update an existing appointment by its code.
 * @access  Private
 */
exports.updateAppointment = async (req, res) => {
  const { id } = req.params;
  const { patientId, doctorEmployeeID, date, timeSlot, status } = req.body;

  const updatedApt = await Appointments.findOneAndUpdate(
    { appointmentCode: id },
    { patientId, doctorEmployeeID, date, timeSlot, status },
    { new: true },
  );

  if (!updatedApt) {
    throw ERR.appointmentNotFound();
  }

  return res.status(200).json({
    message: "Appointment updated successfully",
    updatedApt,
  });
};

/**
 * @desc    Cancel an appointment by updating its status. Note: Not directly exposed via a dedicated route in the provided files.
 * @access  Private
 */
exports.cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const cancelledApt = await Appointments.findOneAndUpdate(
    { appointmentCode: id },
    { status },
    { new: true },
  );

  if (!cancelledApt) {
    throw ERR.appointmentNotFound();
  }

  return res.status(200).json({
    message: "Appointment cancelled successfully",
    updatedApt,
  });
};

/**
 * @route   DELETE /api/appointments/:id
 * @desc    Soft delete an appointment by updating its status to 'Deleted'.
 * @access  Private
 */
exports.deleteAppointment = async (req, res) => {
  const { id } = req.params;

  const deletedApt = await Appointments.findOneAndUpdate(
    {
      appointmentCode: id,
    },
    {
      status: "Deleted",
    },
  );

  if (!deletedApt) {
    throw ERR.appointmentNotFound();
  }

  return res.status(200).json({ message: "Appointment deleted successfully" });
};

/**
 * @route   GET /api/appointments/my-appointments
 * @desc    Get all appointments for the currently authenticated patient, with filtering options.
 * @access  Private
 */
exports.getPatientAppointments = async (req, res) => {
  const { doctor, appointmentId, date, status } = req.query;
  const patient = await Patients.findOne({ email: req.user.email });

  if (!patient) {
    throw ERR.patientNotFound();
  }

  const appointments = await Appointments.aggregate([
    { $match: { patientId: patient.UHID, status: { $ne: "Deleted" } } },
    {
      $lookup: {
        from: "employees",
        localField: "doctorEmployeeID",
        foreignField: "employeeCode",
        as: "doctorInfo",
      },
    },
    {
      $match: {
        ...(doctor && {
          $or: [
            { doctorEmployeeID: doctor },
            { "doctorInfo.name": new RegExp(doctor, "i") },
          ],
        }),
        ...(appointmentId && { appointmentCode: appointmentId }),
        ...(date && {
          date: {
            $gte: new Date(new Date(date).setUTCHours(0, 0, 0, 0)),
            $lte: new Date(new Date(date).setUTCHours(23, 59, 59, 999)),
          },
        }),
        ...(status && { status: new RegExp(`^${status}$`, "i") }),
      },
    },
    {
      $sort: {
        date: 1,
        "doctorInfo.name": 1,
        appointmentCode: 1,
      },
    },
    {
      $project: {
        appointmentCode: 1,
        date: 1,
        timeSlot: 1,
        status: 1,
        doctorName: { $arrayElemAt: ["$doctorInfo.name", 0] },
        doctorDept: { $arrayElemAt: ["$doctorInfo.department", 0] },
        doctorSpecialization: {
          $arrayElemAt: ["$doctorInfo.specialization", 0],
        },
      },
    },
  ]);

  res.status(200).json(appointments);
};

/**
 * @route   GET /api/appointments/all
 * @desc    Get all appointments, scoped to the current user's role (Admin, Doctor, or Patient).
 * @access  Private
 */
exports.getAllAppointments = async (req, res) => {
  const userRole = req.user?.role?.toUpperCase();
  const employeeID = req.user?.employeeID;

  let matchStage = {};
  if (userRole === "DOCTOR") {
    matchStage = { doctorEmployeeID: employeeID };
  } else if (userRole === "PATIENT") {
    matchStage = { patientId: req.user.UHID };
  }

  const appointments = await Appointments.find(matchStage)
    .select("appointmentCode patientId doctorEmployeeID date timeSlot status")
    .sort({ createdAt: -1 });

  res.status(200).json(appointments);
};
