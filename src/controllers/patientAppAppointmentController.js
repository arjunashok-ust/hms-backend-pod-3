const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");

//======================================
//Create Appointment
//======================================
exports.createPatientAppointment = async (req, res) => {
  try {
    const { doctorEmployeeId, date, timeSlot } = req.body;

    const patient = await Patient.findOne({
      email: req.user.email,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient Not Found",
      });
    }

    const existingAppointment = await Appointment.findOne({
      doctorEmployeeId,
      date,
      timeSlot,
      status: { $in: ["PENDING", "BOOKED"] },
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

    const appointment = await Appointment.create({
      patientId: patient.UHID,
      doctorEmployeeId,
      date,
      timeSlot,
      status: "PENDING",
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
//Get Appointments

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
          doctorName: doctor?.name || "Unknown Doctor",
          specialization: doctor?.specialization || "N/A",
        };
      }),
    );

    return res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      data: enrichedAppointments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error During Get Patient Appointments",
    });
  }
};

//=================================
//Cancel Appointment
//=================================
exports.cancelAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      email: req.user.email,
    });

    if (!patient) {
      return res.status(404).json({
        message: "Patient Not Found",
      });
    }

    const appointment = await Appointment.findOne({
      appointmentId: req.params.id,
      patientId: patient.UHID,
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment Not Found",
      });
    }
    if (appointment.status === "CANCELLED") {
      return res.status(400).json({
        message: "Appointment Already Cancelled",
      });
    }
    if (appointment.status === "COMPLETED") {
      return res.status(400).json({
        message: "Completed Appointment Cannot Be Cancelled",
      });
    }

    appointment.status = "CANCELLED";

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Appointment Cancelled Successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

//=================================
//Get Available Slots
//=================================
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorEmployeeId, date } = req.params;

    const doctor = await Employee.findOne({
      employeeId: doctorEmployeeId,
      status: true,
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor Not Found",
      });
    }

    const selectedDate = new Date(date);

    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + 1);

    const bookedAppointments = await Appointment.find({
      doctorEmployeeId,
      date: {
        $gte: selectedDate,
        $lt: nextDate,
      },
      status: {
        $in: ["PENDING", "BOOKED"],
      },
    });

    const bookedSlots = new Set(
      bookedAppointments.map((appointment) => appointment.timeSlot),
    );

    const availableSlots = doctor.availabilitySlots.filter(
      (slot) => !bookedSlots.includes(slot),
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

    return res.status(200).json({
      success: true,
      slots: finalSlots,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error During Get Available Slots",
    });
  }
};
