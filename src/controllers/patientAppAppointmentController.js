const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
exports.createPatientAppointment = async (req, res) => {
  try {
    const {
      doctorEmployeeId,
      date,
      timeSlot,
    } = req.body;

    const patient = await Patient.findOne({
      email: req.user.email,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient Not Found",
      });
    }

    const existingAppointment =
      await Appointment.findOne({
        doctorEmployeeId,
        date,
        timeSlot,
        status: "BOOKED",
      });

    if (existingAppointment) {
      return res.status(409).json({
        message: "Slot Already Booked",
      });
    }

    const doctor = await Employee.findOne({
      employeeId: doctorEmployeeId,
      status: true,
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor Not Found",
      });
    }

    const appointment =
      await Appointment.create({
        patientId: patient.UHID,
        doctorEmployeeId,
        date,
        timeSlot,
        status: "BOOKED",
      });

    return res.status(201).json({
      success: true,
      message: "Appointment Created Successfully",
      appointment,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error During Create Appointment",
    });
  }
};




exports.getPatientAppointments = async (req, res) => {
  try {

    const patient = await Patient.findOne({
      email: req.user.email,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient Not Found",
      });
    }

    const appointments = await Appointment.find({
      patientId: patient.UHID,
    }).sort({ createdAt: -1 });

    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {

        const doctor = await Employee.findOne({
          employeeId: appointment.doctorEmployeeId,
        });

        return {
          ...appointment.toObject(),
          doctorName:
            doctor?.name || "Unknown Doctor",
          specialization:
            doctor?.specialization || "N/A",
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      data: enrichedAppointments,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message:
        "Server Error During Get Patient Appointments",
    });

  }
};