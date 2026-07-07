/**
 * @file departmentController.js
 * @description This file contains the controller functions for managing all department-related operations, 
 * such as creating, retrieving, updating, and deleting hospital departments.
 * @description
 * This file contains controller functions for managing hospital departments.
 *
 * @overview
 * This controller is called from a route handler after authentication and permission middleware have passed.
 * It contains the core business logic for creating, reading, updating, and deleting department records.
 * It interacts with the Departments and Employees Models. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   ... -> requirePermission -> asyncHandler -> DEPARTMENTCONTROLLER.JS -> [Departments, Employees] Models
 *   DEPARTMENTCONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const Departments = require("../models/Departments");
const Employees = require("../models/Employees");
const ERR = require("../utils/errors.utils");

/**
 * @route   POST /api/departments
 * @desc    Create a new department.
 * @access  Private
 */
exports.createDepartment = async (req, res) => {
  const { departmentName } = req.body;
  if (!departmentName) {
    throw ERR.invalidRequest(
      "departmentName is required",
      "DEPARTMENT_NAME_REQUIRED",
    );
  }

  const existingDepartment = await Departments.findOne({
    departmentName: { $regex: new RegExp(`^${departmentName}$`, "i") },
  });

  if (existingDepartment) {
    throw ERR.conflict(
      "Department with this name already exists",
      "DEPARTMENT_ALREADY_EXISTS",
    );
  }

  const newDepartment = await Departments.create({
    departmentName: departmentName.toUpperCase(),
  });

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    data: newDepartment,
  });
};

/**
 * @route   GET /api/departments
 * @desc    Get all departments.
 * @access  Private
 */
exports.getAllDepartments = async (req, res) => {
  const departments = await Departments.find({}).sort({ departmentName: 1 });
  res.status(200).json({
    success: true,
    data: departments,
  });
};

/**
 * @route   PUT /api/departments/:id
 * @desc    Update a department by its ID.
 * @access  Private
 */
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { departmentName } = req.body;

  if (!departmentName) {
    throw ERR.invalidRequest(
      "departmentName is required for update",
      "DEPARTMENT_NAME_REQUIRED",
    );
  }

  const updatedDepartment = await Departments.findOneAndUpdate(
    { departmentId: id },
    { $set: { departmentName: departmentName.toUpperCase() } },
    { new: true, runValidators: true },
  );

  if (!updatedDepartment) {
    throw ERR.notFound("Department not found", "DEPARTMENT_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    data: updatedDepartment,
  });
};

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete a department by its ID.
 * @access  Private
 */
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  const deletedDepartment = await Departments.findOneAndDelete({
    departmentId: id,
  });

  if (!deletedDepartment) {
    throw ERR.notFound("Department not found", "DEPARTMENT_NOT_FOUND");
  }

  res
    .status(200)
    .json({ success: true, message: "Department deleted successfully" });
};
