/**
 * @file dashboardController.js
 * @description This file contains controller functions for fetching aggregated data and statistics for the main dashboard.
 *
 * @description
 * This file contains controller functions for fetching aggregated data for the main dashboard.
 *
 * @overview
 * This controller is called from a route handler after authentication and permission middleware have passed.
 * It contains the core business logic for aggregating statistics from various parts of the application for display on a dashboard.
 * It interacts with multiple Models to count documents and perform aggregations. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> DASHBOARDCONTROLLER.JS -> [Employees, Users, Appointments] Models
 *   DASHBOARDCONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");
const ERR = require("../utils/errors.utils");

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get overall system statistics for the dashboard.
 * @access  Private
 */
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

/**
 * @route   GET /api/dashboard/tenEmployees
 * @desc    Get an overview of the 10 most recently created employees.
 * @access  Private
 */
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
