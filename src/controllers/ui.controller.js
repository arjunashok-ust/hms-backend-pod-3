const roleModel = require("../models/Role");
const departmentModel = require("../models/Department");
const specializationModel = require("../models/Specialization");

// getRoles
exports.getRoles = async (req, res) => {
    try {
        const roles = await roleModel.find({}, "roleName");
        return res.status(200).json(roles);
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: "error in getRoles"})
    }
}

// getDepartments
exports.getDepartments = async (req, res) => {
    try {
        const departments = await departmentModel.find({}, "departmentName");
        return res.status(200).json(departments);
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: "error in getDepartments"});
    }
}

// getSpecializations
exports.getSpecializations = async (req, res) => {
    try {
        const specializations = await specializationModel.find({}, "specializationName");
        return res.status(200).json(specializations);
    } catch (err) {
        console.error(err);
        return res.status(500).json({message: "error in getSpecializations"});
    }
}