const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model');

const { ROLES } = require('../constants/roles.constants');

// roles that can be picked when registering an employee
const getRoles = () =>
    Role.find({ role_name: { $nin: [ROLES.SUPER_ADMIN, ROLES.PATIENT] } }, 'role_name').lean();

const getDepartments = () => Department.find({}, 'department_name').lean();

const getSpecializations = () => Specialization.find().lean();

module.exports = { getRoles, getDepartments, getSpecializations };
