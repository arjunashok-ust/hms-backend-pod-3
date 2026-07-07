/**
 * @file employeeController.js
 * @description
 * This file contains controller functions for managing employee operations.
 * It includes fetching, updating, deleting, and managing approval status.
 *
 * @overview
 * This controller is called from a route handler after authentication and permission middleware have passed.
 * It contains the core business logic for managing employee records, including fetching lists, updating profiles, and handling administrative actions like approvals and deletions.
 * It interacts with multiple Models to ensure data integrity across the system. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> EMPLOYEECONTROLLER.JS -> [Employees, Users, Appointments] Models
 *   EMPLOYEECONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Appointments = require("../models/Appointments");
const ERR = require("../utils/errors.utils");

/**
 * @route   GET /api/employees/all
 * @desc    Get all employees with pagination, filtering, and search.
 * @access  Private
 */
exports.getAllEmployees = async (req, res) => {
  let page = Number.parseInt(req.query.page) || 1;
  let limit = Number.parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // Validate page and limit.
  page = !Number.isNaN(page) && page > 0 ? page : 1;
  limit = !Number.isNaN(limit) && limit > 0 ? limit : 5;
  limit = Math.min(limit, 50);

  let matchStage = {
    name: { $exists: true, $ne: "" },
    employeeCode: { $exists: true, $ne: null },
    status: { $ne: "DELETED" },
  };

  if (req.query.department) {
    matchStage.department = req.query.department;
  }
  if (req.query.status) {
    matchStage.status = req.query.status;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    matchStage.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { employeeCode: searchRegex },
    ];
  }

  const totalStats = await Employees.aggregate([
    {
      $match: {
        name: { $exists: true, $ne: "" },
        employeeCode: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$status", "ADMIN_APPROVAL_PENDING"] }, 1, 0],
          },
        },
        verified: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
        inactive: {
          $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] },
        },
        firstLogin: {
          $sum: {
            $cond: [{ $eq: ["$status", "PASSWORD_CHANGE_PENDING"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const stats =
    totalStats.length > 0
      ? totalStats[0]
      : { total: 0, pending: 0, verified: 0, inactive: 0, firstLogin: 0 };

  const employees = await Employees.aggregate([
    { $match: matchStage },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
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
              status: { $ifNull: ["$status", "INACTIVE"] },
            },
          },
          {
            $project: {
              userInfo: 0,
              __v: 0,
            },
          },
        ],
      },
    },
  ]);

  const total = employees[0].metadata[0] ? employees[0].metadata[0].total : 0;
  const data = employees[0].data;

  res.status(200).json({
    success: true,
    data,
    stats,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

/**
 * @route   DELETE /api/employees/:id
 * @desc    Soft delete an employee and their associated user account.
 * @access  Private
 */
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;

  const targetUser = await Users.findOne({ employeeID: id });
  if (targetUser?.role === "ADMIN") {
    const userPermissions = req.user?.permissions || [];
    if (!userPermissions.includes("DELETE_ADMIN")) {
      throw ERR.forbidden(
        "Access Denied: You lack the DELETE_ADMIN permission required to remove an Administrator.",
        "DELETE_ADMIN_FORBIDDEN",
      );
    }
  }

  const deletedEmployee = await Employees.findOneAndUpdate(
    { employeeCode: id },
    { $set: { status: "DELETED" } },
    { new: true },
  );
  const deletedUser = await Users.findOneAndUpdate(
    { employeeID: id },
    { $set: { status: "DELETED" } },
    { new: true },
  );

  if (!deletedEmployee && !deletedUser) {
    throw ERR.employeeNotFound();
  }

  const deletedDoctorAppointments = await Appointments.updateMany(
    { doctorEmployeeID: id },
    { $set: { status: "Deleted" } },
  );

  const deletedCount = deletedDoctorAppointments.modifiedCount;

  res.status(200).json({
    message: `Employee permanently deleted.No of appointemnts deleted:${deletedCount}`,
  });
};

/**
 * @route   PUT /api/employees/:id
 * @desc    Update an employee's profile and user account information.
 * @access  Private
 */
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const targetUser = await Users.findOne({ employeeID: id });
  if (targetUser?.role === "ADMIN") {
    const userPermissions = req.user?.permissions || [];
    if (!userPermissions.includes("UPDATE_ADMIN")) {
      throw ERR.forbidden(
        "Access Denied: You lack the UPDATE_ADMIN permission required to modify an Administrator.",
        "UPDATE_ADMIN_FORBIDDEN",
      );
    }
  }

  const employeeUpdates = { ...updates };
  delete employeeUpdates._id;
  delete employeeUpdates.employeeCode;
  delete employeeUpdates.role;

  const updatedProfile = await Employees.findOneAndUpdate(
    { employeeCode: id },
    { $set: employeeUpdates },
    { new: true, runValidators: true },
  );

  if (!updatedProfile) {
    throw ERR.employeeNotFound();
  }

  const userUpdates = {};
  if (updates.role !== undefined) userUpdates.role = updates.role;
  if (updates.status !== undefined) userUpdates.status = updates.status;
  if (updates.email !== undefined) userUpdates.email = updates.email;

  if (Object.keys(userUpdates).length > 0) {
    await Users.findOneAndUpdate(
      { employeeID: id },
      { $set: userUpdates },
      { new: true, runValidators: true },
    );
  }

  res.status(200).json({
    message: "Employee updated successfully",
    employee: updatedProfile,
  });
};

/**
 * @route   PATCH /api/employees/approve/:id
 * @desc    Approve a new employee by setting their status to 'ACTIVE'.
 * @access  Private
 */
exports.approveEmployee = async (req, res) => {
  const { id } = req.params;

  const emp = await Employees.findOneAndUpdate(
    { employeeCode: id },
    { $set: { status: "ACTIVE" } },
    { new: true, runValidators: true },
  );

  const user = await Users.findOneAndUpdate(
    { employeeID: id },
    { $set: { status: "ACTIVE" } },
    { new: true, runValidators: true },
  );

  if (!emp || !user) {
    throw ERR.notFound(
      "Employee or User account record missing",
      "EMPLOYEE_USER_RECORD_MISSING",
    );
  }

  res.status(200).json({ message: "Employee approved successfully" });
};

/**
 * @route   PATCH /api/employees/reject/:id
 * @desc    Reject an employee by setting their status to 'INACTIVE'.
 * @access  Private
 */
exports.rejectEmployee = async (req, res) => {
  const { id } = req.params;

  const user = await Users.findOneAndUpdate(
    { employeeID: id },
    { $set: { status: "INACTIVE" } },
    { new: true, runValidators: true },
  );

  const emp = await Employees.findOneAndUpdate(
    { employeeCode: id },
    { $set: { status: "INACTIVE" } },
    { new: true, runValidators: true },
  );

  if (!emp || !user) {
    throw ERR.notFound(
      "Employee or User account record not found",
      "EMPLOYEE_USER_RECORD_MISSING",
    );
  }

  res.status(200).json({ message: "Employee rejected successfully" });
};
