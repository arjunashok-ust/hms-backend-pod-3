const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
/* ================================
   CREATE APPOINTMENT
================================ */
exports.createAppointment = async (req, res) => {
  try {
    const { patientId, doctorEmployeeId, date, timeSlot, status } = req.body;

    /* CHECK PATIENT */
    const patient = await Patient.findOne({ UHID: patientId });
    if (!patient) {
      return res.status(404).json({ message: "Patient Not Found" });
    }

    /* CHECK DOCTOR */
    const doctor = await Employee.findOne({
      employeeId: doctorEmployeeId,
      status: true,
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor Not Found",
      });
    }

    /* CHECK SLOT */
    const existingAppointment = await Appointment.findOne({
      doctorEmployeeId,
      date,
      timeSlot,
      status: "BOOKED",
    });

    if (existingAppointment) {
      return res.status(409).json({ message: "Slot Already Booked" });
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

    return res.status(201).json({
      success: true,
      message: "Appointment Created Successfully",
      appointment,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server Error During Create Appointment",
    });
  }
};

/* ================================
   GET ALL APPOINTMENTS
================================ */


exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .sort({ createdAt: -1 });

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {

        const doctor = await Employee.findOne({
          employeeId: appointment.doctorEmployeeId
        });

        const patient = await Patient.findOne({
          patientId: appointment.patientId
        });

        return {
          ...appointment.toObject(),

          doctorName: doctor?.name || "Unknown Doctor",

          specialization:
            doctor?.specialization || "N/A",

          patientName:
            patient?.name || "Unknown Patient",
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      data: enrichedAppointments,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server Error During Get Appointments",
    });
  }
};

/* ================================
   GET DOCTORS
================================ */

exports.getDoctors = async (req, res) => {
  try {
    /* GET USERS WITH DOCTOR ROLE */
    const doctorUsers = await User.find({
      role: "doctor",
      status: true,
    });

    const employeeIds = doctorUsers.map((doctor) => doctor.employeeId);

    /* GET EMPLOYEE DETAILS */
    const doctors = await Employee.find({
      employeeId: { $in: employeeIds },
      status: true,
    }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server Error During Get Doctors",
    });
  }
};

/* ================================
   APPOINTMENT UI STATS
================================ */
exports.getAppointmentUI = async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const bookedAppointments = await Appointment.countDocuments({
      status: "BOOKED",
    });
    const cancelledAppointments = await Appointment.countDocuments({
      status: "CANCELLED",
    });
    const completedAppointments = await Appointment.countDocuments({
      status: "COMPLETED",
    });

    return res.status(200).json({
      totalAppointments,
      bookedAppointments,
      cancelledAppointments,
      completedAppointments,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server Error During Appointment UI",
    });
  }
};

/* ================================
   DELETE APPOINTMENT
================================ */
exports.deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findOne({ appointmentId });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment Not Found" });
    }

    await appointment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Appointment Deleted Successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server Error During Delete Appointment",
    });
  }
};

