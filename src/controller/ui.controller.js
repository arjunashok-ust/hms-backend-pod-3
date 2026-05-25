const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model');

// getRoles
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({ role_name: {$ne: 'Admin'}}, 'role_name');
        return res.status(200).json(
            roles
        )
    } catch (err) {
        console.error(err);
    }
}

// getDepartments
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find({}, 'department_name');
        return res.status(200).json(
            departments
        )
    } catch (err) {
        console.error(err);
    }
}


// getSpecializations
const getSpecializations = async (req, res) => {
    try {
        const specializations = await Specialization.find({}, 'specialization_name');
        return res.status(200).json(
            specializations
        )
    } catch (err) {
        console.error(err);
    }
}

module.exports = { getRoles, getDepartments, getSpecializations }