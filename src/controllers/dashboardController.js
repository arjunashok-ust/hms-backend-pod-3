const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");
const ERR = require("../utils/errors.utils");

exports.getDashboardStats = async (req, res) => {
  const totalEmployees = await Employees.countDocuments();
  const activeEmployees = await Employees.countDocuments({ status: "ACTIVE" });
  const pendingApprovals = await Users.countDocuments({
    status: "ADMIN_APPROVAL_PENDING",
  });
  const distinctDepartments = await Employees.distinct("department");
  const totalAppointments = await Appointments.countDocuments();
  const totalPatients = await Users.countDocuments({
    role: "PATIENT",
    status: "ACTIVE",
  });

  res.status(200).json({
    totalEmployees,
    activeEmployees,
    pendingApprovals,
    pendingVerifications: 0,
    totalPatients,
    totalDepartments: distinctDepartments.length,
    totalAppointments,
  });
};

exports.getEmployeeOverview = async (req, res) => {
  const employees = await Employees.aggregate([
    {
      $match: {
        status: { $ne: "DELETED" },
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },

    {
      $lookup: {
        from: "users",
        localField: "employeeCode",
        foreignField: "employeeID",
        as: "userInfo",
      },
    },

    {
      $addFields: {
        role: { $arrayElemAt: ["$userInfo.role", 0] },
      },
    },

    {
      $project: {
        employeeCode: 1,
        name: 1,
        email: 1,
        designation: 1,
        status: 1,
        department: 1,
        role: 1,
      },
    },
  ]);

  res.status(200).json(employees);
};
