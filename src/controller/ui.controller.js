const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model');

const asyncHandler = require('../utils/asyncHandler.utils');

// getRoles
const getRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({ role_name: { $nin: ['Super Admin', 'Patient'] } }, 'role_name');
    return res.status(200).json(
        roles
    );
});

// getDepartments
const getDepartments = asyncHandler(async (req, res) => {
    const departments = await Department.find({}, 'department_name');
    return res.status(200).json(
        departments
    );
});


// getSpecializations
const getSpecializations = asyncHandler(async (req, res) => {
    const specializations = await Specialization.find();
    return res.status(200).json(
        specializations
    );
});

module.exports = { getRoles, getDepartments, getSpecializations }