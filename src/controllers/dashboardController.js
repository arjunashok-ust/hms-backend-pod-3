const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employees.countDocuments();
    const activeEmployees = await Employees.countDocuments({ status: true });
    const pendingApprovals = await Users.countDocuments({ isVerified: false });
    const distinctDepartments = await Employees.distinct("department");
    const totalAppointments = await Appointments.countDocuments();
    
    res.status(200).json({
      totalEmployees,
      activeEmployees,
      pendingApprovals,
      pendingVerifications: 0, 
      totalPatients: 1, 
      totalDepartments: distinctDepartments.length,
      totalAppointments,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
};

exports.getEmployeeOverview = async (req, res) => {
  try {
    const employees = await Employees.aggregate([
      
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
    
      {
        $lookup: {
          from: "users",
          localField: "employeeCode",
          foreignField: "employeeID",
          as: "userInfo"
        }
      },
      
      {
        $addFields: {
          role: { $arrayElemAt: ["$userInfo.role", 0] }
        }
      },
      
      {
        $project: {
          employeeCode: 1,
          name: 1,
          email: 1,
          designation: 1,
          status: 1,
          department: 1,
          role: 1 
        }
      }
    ]);

    res.status(200).json(employees);
  } catch (error) {
    console.error("Employee Overview Error:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};