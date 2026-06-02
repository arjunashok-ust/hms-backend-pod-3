const Employee = require("../models/employee");
const Patient = require("../models/patient");
const Appointment = require("../models/appointmnt");
const User = require("../models/user");

exports.getDashboardStats = async (req, res) => {

  try {

    const totalEmployees = await Employee.countDocuments();

    const activeEmployees = await Employee.countDocuments({
      status: "Active"
    });

    const pendingApprovals = await User.countDocuments({
      approvalStatus: "Pending"
    });

    const pendingVerifications = await User.countDocuments({
      isVerified: false
    });

    const totalPatients = await Patient.countDocuments();

    const departments = await Employee.distinct("department");

    const appointments = await Appointment.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        pendingApprovals,
        pendingVerifications,
        totalPatients,
        departments: departments.length,
        appointments
      }
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Dashboard fetch failed"
    });

  }
};