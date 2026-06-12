const jwt = require("jsonwebtoken");
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");
const Patients = require("../models/Patients");

exports.getAppointmentStats = async (req, res) => {
  try {
    const total = await Appointments.countDocuments();
    const completed = await Appointments.countDocuments({
      status: "Completed",
    });
    const booked = await Appointments.countDocuments({ status: "Scheduled" });
    const cancelled = await Appointments.countDocuments({
      status: "Cancelled",
    });

    res.status(200).json({ total, completed, booked, cancelled });
  } catch (error) {
    console.error("Appointment Stats Error:", error);
    res.status(500).json({ message: "Error fetching appointment stats" });
  }
};

exports.getDoctorsList = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Get Doctors Error:", error);
    res.status(500).json({ message: "Error fetching doctors list" });
  }
};

exports.getRecentAppointments = async (req, res) => {
  try {
    const appointments = await Appointments.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
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
          patientID: 1,
          doctorEmployeeID: 1,
          date: 1,
          timeSlot: 1,
          status: 1,
          doctorName: { $arrayElemAt: ["$doctorInfo.name", 0] },
          doctorDept: { $arrayElemAt: ["$doctorInfo.department", 0] },
          creatorName: { $arrayElemAt: ["$creatorInfo.name", 0] },
        },
      },
    ]);

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Get Recent Appointments Error:", error);
    res.status(500).json({ message: "Error fetching recent appointments" });
  }
};

const normalizeToUTCWithoutTime = (dateInput) => {
  const d = new Date(dateInput);
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
  );
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res
        .status(400)
        .json({ message: "Doctor ID and date are required" });
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
      return res.status(404).json({ message: "Doctor not found" });
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

    const bookedSlots = new Set(
      existingAppointments.map((apt) => apt.timeSlot),
    );
    const availableSlots = allPossibleSlots.filter(
      (slot) => !bookedSlots.has(slot),
    );

    res.status(200).json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Failed to fetch time slots" });
  }
};

exports.addAppointment = async (req, res) => {
  try {
    const { patientID, doctorEmployeeID, date, timeSlot } = req.body;
    const userRole = req.user?.role;

    if (!patientID || !doctorEmployeeID || !date || !timeSlot) {
      return res
        .status(400)
        .json({ message: "Missing required appointment fields" });
    }

    const doctor = await Employees.findOne({ employeeCode: doctorEmployeeID });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const exactDate = normalizeToUTCWithoutTime(date);

    const patientConflict = await Appointments.findOne({
      patientID: patientID,
      date: exactDate,
      timeSlot: timeSlot,
      status: { $in: ["Scheduled", "Pending"] },
    });

    if (patientConflict) {
      if (userRole.toUpperCase() == "PATIENT") {
        return res.status(409).json({
          message:
            "You already have an active appointment booked for this exact time slot.",
        });
      }
      else{
        return res.status(409).json({
          message:
            "This patient already have an active appointment booked for this exact time slot with another doctor.",
        });
      }
    }

    const doctorConflictCount = await Appointments.countDocuments({
      doctorEmployeeID: doctorEmployeeID,
      date: exactDate,
      timeSlot: timeSlot,
      status: { $in: ["Scheduled", "Pending"] },
    });

    if (doctorConflictCount > 0) {
      return res
        .status(400)
        .json({ message: "This time slot is no longer available." });
    }

    const status =
      userRole === "PATIENT" ? "Pending" : req.body.status || "Scheduled";
    const createdByEmployeeID =
      userRole === "PATIENT" ? null : req.user.employeeID;

    const newAppointment = await Appointments.create({
      patientID,
      doctorEmployeeID,
      date: exactDate,
      timeSlot,
      status,
      createdByEmployeeID,
    });

    return res
      .status(201)
      .json({ message: "Appointment requested successfully.", newAppointment });
  } catch (err) {
    console.error("Add Appointment Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientID, doctorEmployeeID, date, timeSlot, status } = req.body;

    const updatedApt = await Appointments.findOneAndUpdate(
      { appointmentCode: id },
      { patientID, doctorEmployeeID, date, timeSlot, status },
      { new: true },
    );

    if (!updatedApt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment updated successfully",
      updatedApt,
    });
  } catch (error) {
    console.error("Update Appointment Error:", error);
    res.status(500).json({ message: "Internal server error during update" });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedApt = await Appointments.findOneAndDelete({
      appointmentCode: id,
    });

    if (!deletedApt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res
      .status(200)
      .json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete Appointment Error:", error);
    res.status(500).json({ message: "Internal server error during deletion" });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const patient = await Patients.findOne({ email: req.user.email });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found." });
    }

    const appointments = await Appointments.aggregate([
      { $match: { patientID: patient.UHID } },

      { $sort: { date: 1 } },

      {
        $lookup: {
          from: "employees",
          localField: "doctorEmployeeID",
          foreignField: "employeeCode",
          as: "doctorInfo",
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
  } catch (error) {
    console.error("Get Patient Appointments Error:", error);
    res.status(500).json({ message: "Error fetching your appointments" });
  }
};
