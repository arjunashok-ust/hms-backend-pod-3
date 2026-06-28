const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");

const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

/* Resolves the logged-in doctor's employeeId so queries can be scoped to them. */
const doctorScopeFilter = async (user) => {
  if (user.role !== "doctor") return {};
  const doctorUser = await User.findById(user.id);
  return { doctorEmployeeId: doctorUser?.employeeId };
};

/* CREATE — validates patient, doctor, and slot availability. */
exports.createAppointment = async ({
  patientId,
  doctorEmployeeId,
  date,
  timeSlot,
  status,
  createdByEmployeeId,
}) => {
  const patient = await Patient.findOne({ UHID: patientId });
  if (!patient) {
    throw new ApiError(404, "Patient Not Found", "PATIENT_NOT_FOUND");
  }

  const doctor = await Employee.findOne({ employeeId: doctorEmployeeId, status: true });
  if (!doctor) {
    throw new ApiError(404, "Doctor Not Found", "DOCTOR_NOT_FOUND");
  }

  const existingAppointment = await Appointment.findOne({
    doctorEmployeeId,
    date,
    timeSlot,
    status: "BOOKED",
  });
  if (existingAppointment) {
    throw new ApiError(409, "Slot Already Booked", "SLOT_CONFLICT");
  }

  return Appointment.create({
    patientId,
    doctorEmployeeId,
    date,
    timeSlot,
    status: status || "BOOKED",
    createdByEmployeeId: createdByEmployeeId || null,
  });
};

/* READ (paginated + enriched). Doctors are scoped to their own appointments. */
exports.getAllAppointments = async ({ query, user }) => {
  const { page, limit, skip } = getPagination(query);

  const filter = await doctorScopeFilter(user);
  if (query.status) filter.status = query.status;

  const totalCount = await Appointment.countDocuments(filter);

  const appointments = await Appointment.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const enrichedAppointments = await Promise.all(
    appointments.map(async (appointment) => {
      const doctor = await Employee.findOne({ employeeId: appointment.doctorEmployeeId });
      const patient = await Patient.findOne({ UHID: appointment.patientId });

      return {
        ...appointment.toObject(),
        doctorName: doctor?.name || "Unknown Doctor",
        specialization: doctor?.specialization || "N/A",
        patientName: patient?.name || "Unknown Patient",
      };
    })
  );

  const meta = buildPaginationMeta(page, limit, totalCount);
  return { appointments: enrichedAppointments, meta };
};

/* STATS — total/booked/cancelled/completed, doctor-scoped where applicable. */
exports.getAppointmentStats = async ({ user }) => {
  const filter = await doctorScopeFilter(user);

  const [totalAppointments, bookedAppointments, cancelledAppointments, completedAppointments] =
    await Promise.all([
      Appointment.countDocuments(filter),
      Appointment.countDocuments({ ...filter, status: "BOOKED" }),
      Appointment.countDocuments({ ...filter, status: "CANCELLED" }),
      Appointment.countDocuments({ ...filter, status: "COMPLETED" }),
    ]);

  return { totalAppointments, bookedAppointments, cancelledAppointments, completedAppointments };
};

/* DELETE (hard). */
exports.deleteAppointment = async ({ appointmentId }) => {
  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }
  await appointment.deleteOne();
  return appointment;
};

/* Active doctors (paginated). */
exports.getDoctors = async ({ query }) => {
  const { page, limit, skip } = getPagination(query);

  const doctorUsers = await User.find({ role: "doctor", status: true });
  const employeeIds = doctorUsers.map((doctor) => doctor.employeeId);

  const doctorFilter = { employeeId: { $in: employeeIds }, status: true };

  const totalCount = await Employee.countDocuments(doctorFilter);

  const doctors = await Employee.find(doctorFilter)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const meta = buildPaginationMeta(page, limit, totalCount);
  return { doctors, meta };
};

/* Set an appointment's status (approve -> BOOKED, reject -> CANCELLED). */
const setAppointmentStatus = async (appointmentId, status) => {
  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }
  appointment.status = status;
  await appointment.save();
  return appointment;
};

exports.approveAppointment = ({ appointmentId }) => setAppointmentStatus(appointmentId, "BOOKED");
exports.rejectAppointment = ({ appointmentId }) => setAppointmentStatus(appointmentId, "CANCELLED");

/* UPDATE — validates a changed doctor and re-checks slot conflicts. */
exports.updateAppointment = async ({ appointmentId, updates }) => {
  const { doctorEmployeeId, date, timeSlot, status } = updates;

  const appointment = await Appointment.findOne({ appointmentId });
  if (!appointment) {
    throw new ApiError(404, "Appointment Not Found", "APPOINTMENT_NOT_FOUND");
  }

  if (doctorEmployeeId && doctorEmployeeId !== appointment.doctorEmployeeId) {
    const doctor = await Employee.findOne({ employeeId: doctorEmployeeId, status: true });
    if (!doctor) {
      throw new ApiError(404, "Doctor Not Found", "DOCTOR_NOT_FOUND");
    }
  }

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

  if (doctorEmployeeId) appointment.doctorEmployeeId = doctorEmployeeId;
  if (date) appointment.date = date;
  if (timeSlot) appointment.timeSlot = timeSlot;
  if (status) appointment.status = status;

  await appointment.save();
  return appointment;
};
