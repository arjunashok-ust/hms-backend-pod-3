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
    //Find Logged-in employee
    const loggedInUser = await User.findOne({
      email: req.user.email,
    });
    /* CREATE */
    const appointment = await Appointment.create({
      patientId,
      doctorEmployeeId,
      date,
      timeSlot,
      status: status || "BOOKED",
      createdByEmployeeId: loggedInUser.employeeId,
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
    let appointments = [];

    // DOCTOR -> ONLY OWN APPOINTMENTS
    if (req.user.role === "doctor") {
      const doctorUser = await User.findById(req.user.id);

      appointments = await Appointment.find({
        doctorEmployeeId: doctorUser.employeeId,
      }).sort({ createdAt: -1 });
    }

    // ADMIN + RECEPTIONIST -> ALL APPOINTMENTS
    else {
      appointments = await Appointment.find().sort({ createdAt: -1 });
    }

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
      }),
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
   APPOINTMENT UI STATS
================================ */
exports.getAppointmentUI = async (req, res) => {
  try {
    let filter = {};

    // DOCTOR -> ONLY HIS APPOINTMENTS
    if (req.user.role === "doctor") {
      const doctorUser = await User.findById(req.user.id);

      filter = {
        doctorEmployeeId: doctorUser.employeeId,
      };
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
//Get Docotors
exports.getDoctors = async (req, res) => {
  try {
    const doctorUsers = await User.find({
      role: "doctor",
      status: true,
    });

    const employeeIds = doctorUsers.map((doctor) => doctor.employeeId);

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
