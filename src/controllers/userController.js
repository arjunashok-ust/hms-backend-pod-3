const User = require('../models/User');
const Employee = require('../models/Employee');
const Patient = require('../models/Patient');

//get current user
exports.currentUser = async (req, res) => {
    try {
        const user = await User.findOne({employeeId: req.user.id}).select("-passwordHash -__v");

        const employee = await Employee.findOne({employeeCode: req.user.id});

        if (!user || !employee) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Send combined response
        res.status(200).json({
            user: {
                id: user.employeeId,
                email: user.email,
                role: user.role,
                status: user.status,
                //lastLoginAt: user.lastLoginAt,
                //createdAt: user.created_at,

                // Employee details
                name: employee.name,
                phone: employee.phone,
                department: employee.department,
                designation: employee.designation,
                joiningDate: employee.joiningDate,
                medicalRegistrationNo: employee.medicalRegistrationNo,
                specialization: employee.specialization,
                qualification: employee.qualification,
                //consultationFee: employee.consultationFee,
                //availabilitySlots: employee.availabilitySlots
            }
        });

    } catch (error) {
        console.error("Unable to fetch current user", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getNameByEmployeeId = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
        const employee = await Employee.findOne({ employeeCode: employeeId });
        if (!employee) {
            return res.status(404).json({ message: "User not found!" });
        }
        return res.status(200).json(employee.name);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Get Name By EmployeeId' });
    }
}

exports.getNameByPatientId = async (req, res) => {
    try {
        const patientId = req.query.patientId;
        const patient = await Patient.findOne({ UHID: patientId });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found!" });
        }
        return res.status(200).json(patient.name);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Get Name By Patient Id' });
    }
}

