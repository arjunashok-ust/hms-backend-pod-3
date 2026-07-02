const Departments = require("../models/Departments");
const Employees = require("../models/Employees");
const ERR = require("../utils/errors.utils");

/**
 * @description Create a new department
 * @route POST /api/departments
 * @access Private (requires permission)
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
 * @description Get all departments
 * @route GET /api/departments
 * @access Private
 */
exports.getAllDepartments = async (req, res) => {
  const departments = await Departments.find({}).sort({ departmentName: 1 });
  res.status(200).json({
    success: true,
    data: departments,
  });
};

/**
 * @description Update a department by its ID
 * @route PUT /api/departments/:id
 * @access Private (requires permission)
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
 * @description Delete a department by its ID
 * @route DELETE /api/departments/:id
 * @access Private (requires permission)
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
