const jwt = require("jsonwebtoken");
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");

exports.getAppointmentStats = async (req, res) => {
  try {
    const total = await Appointments.countDocuments();
    const completed = await Appointments.countDocuments({ status: "Completed" });
    const booked = await Appointments.countDocuments({ status: "Scheduled" });
    const cancelled = await Appointments.countDocuments({ status: "Cancelled" });

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
          as: "profile"
        }
      },
      { $unwind: "$profile" },
      {
        $project: {
          employeeCode: "$profile.employeeCode",
          name: "$profile.name",
          department: "$profile.department",
          status: "$profile.status",
        }
      }
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
          as: "doctorInfo"
        }
      },

      {
        $lookup: {
          from: "employees",
          localField: "createdByEmployeeID",
          foreignField: "employeeCode",
          as: "creatorInfo"
        }
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
          creatorName: { $arrayElemAt: ["$creatorInfo.name", 0] }
        }
      }
    ]);

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Get Recent Appointments Error:", error);
    res.status(500).json({ message: "Error fetching recent appointments" });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    console.log("\n--- 🔍 SLOTS API TRIGGERED ---");
    const { doctorId, date } = req.query;
    console.log(`1. Received Request -> Doctor: ${doctorId}, Date: ${date}`);

    if (!doctorId || !date) {
      console.log("❌ Missing doctorId or date");
      return res.status(400).json({ message: "Doctor ID and date are required" });
    }

    const doctor = await Employees.findOne({ employeeCode: doctorId });
    if (!doctor) {
      console.log(`❌ Doctor not found in DB: ${doctorId}`);
      return res.status(404).json({ message: "Doctor not found" });
    }

    console.log(`2. Found Doctor: ${doctor.name}`);
    console.log(`3. Doctor DB Slots:`, doctor.availabilitySlots);

    if (!doctor.availabilitySlots || doctor.availabilitySlots.length === 0) {
      console.log("⚠️ Doctor has no availabilitySlots array in DB.");
      return res.status(200).json([]); 
    }

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const existingAppointments = await Appointments.find({
      doctorEmployeeID: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "Cancelled" }
    });

    console.log(`4. Existing Appointments on this day: ${existingAppointments.length}`);

    const availableSlots = doctor.availabilitySlots.map(slot => {
      const timeString = `${slot.startTime} - ${slot.endTime}`;
      const bookedCount = existingAppointments.filter(apt => apt.timeSlot === timeString).length;
      
      const isAvailable = bookedCount < 1;
      console.log(`   -> Slot [${timeString}] has ${bookedCount}/1 bookings. Available? ${isAvailable}`);

      return {
        timeSlot: timeString,
        isAvailable: isAvailable
      };
    }).filter(slot => slot.isAvailable); 

    const finalArray = availableSlots.map(s => s.timeSlot);
    console.log(`5. Final Array sent to Frontend:`, finalArray);
    console.log("------------------------------\n");

    res.status(200).json(finalArray);

  } catch (error) {
    console.error("❌ Get Slots CRASH:", error);
    res.status(500).json({ message: "Error fetching available slots" });
  }
};

exports.addAppointment = async (req, res) => {
  try {
    const { patientID, doctorEmployeeID, date, timeSlot, status } = req.body;

    const doctor = await Employees.findOne({ employeeCode: doctorEmployeeID });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const queryDate = new Date(date);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    const bookedCount = await Appointments.countDocuments({
      doctorEmployeeID,
      timeSlot,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "Cancelled" }
    });

    if (bookedCount > 0) {
      return res.status(400).json({ message: "This time slot is fully booked (Max 1 appointments)." });
    }

    const createdByEmployeeID = req.user.employeeID;

    const newAppointment = await Appointments.create({
      patientID,
      doctorEmployeeID,
      date,
      timeSlot,
      status,
      createdByEmployeeID,
    });

    return res.status(201).json({
      message: "Appointment created successfully.",
      newAppointment,
    });

  } catch (err) {
    console.error("Add Appointment error: ", err);
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
      { new: true } 
    );

    if (!updatedApt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment updated successfully",
      updatedApt
    });
  } catch (error) {
    console.error("Update Appointment Error:", error);
    res.status(500).json({ message: "Internal server error during update" });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedApt = await Appointments.findOneAndDelete({ appointmentCode: id });
    
    if (!deletedApt) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete Appointment Error:", error);
    res.status(500).json({ message: "Internal server error during deletion" });
  }
};