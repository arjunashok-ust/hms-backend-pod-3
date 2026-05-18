const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const medicalRecord = require('../models/medicalRecord.model');
const Bill = require('../models/bill.model');
const Payment = require('../models/payment.model');
const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model')

// SignUp
const signUp = async (req, res) => {
    try {
        const {
            name,
            roles,
            email,
            password,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        } = req.body;

        const existingUser = await Employee.findOne({ email });

        if (existingUser) {
            // 409 conflict
            return res.status(409).json({ message: 'email is already registered.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        if (!roles) {
            return res.status(404).json({ message: 'role is required.' });
        }

        if (roles?.includes('doctor', 'nurse', 'pharmacist', 'lab_tech')) {
            const medicalRegNo = await Employee.findOne({ medicalRegistrationNo: medicalRegistrationNo });
            if (medicalRegNo) {
                return res.status(409).json({ message: 'medical registration no should be unique.' });
            }
        }

        const profile = await Employee.create({
            name,
            email,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        });

        const user = await User.create({
            email: email,
            passwordHash: passwordHash,
            status: status,
            roles: roles,
            employeeId: profile.employeeCode,
        });

        console.log("account created.");
        // 201 created
        return res.status(201).json({
            message: "account created sucessfully.",
            email: user.email,
            roles: user.roles,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during signup' });
    }
}

// Login
const login = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ message: 'invalid credentials.' })
        }

        const isMatch = await bcrypt.compare(password, existingUser.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'invalid credentials.' });
        }

        existingUser.lastLoginAt = Date.now();
        await existingUser.save();

        const token = await jwt.sign(
            { id: existingUser.employeeId, role: existingUser.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        console.log("login sucessfull");
        return res.status(200).json({
            message: 'login sucessfull',
            email: existingUser.email,
            employeeId: existingUser.employeeId,
            token: token
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during login' });
    }
}

const getRoles = async (req, res) => {
    const roles = await Role.find({}, 'role_name');
    return res.status(200).json(roles);
}

const getDepartments = async (req, res) => {
    const departments = await Department.find({}, 'department_name');
    return res.status(200).json(departments);
}

const getSpecializations = async (req,res) => {
    const specializations = await Specialization.find({},'specialization_name');
    return res.status(200).json(specializations);
}


module.exports = { signUp, login, getRoles, getDepartments,getSpecializations };

