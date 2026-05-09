const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');

const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const medicalRecord = require('../models/medicalRecord.model');
const Bill = require('../models/bill.model');
const Payment = require('../models/payment.model');

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
            roles: designation,
            employeeId: profile.employeeCode,
        });

        const token = jwt.sign(
            { employeeId: user.employeeId, roles: roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        console.log("account created.");
        // 201 created
        return res.status(201).json({
            message: "account created sucessfully.",
            email: email,
            roles: roles,
            token: token,
        });
    }
    catch (err) {
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
            return res.status(404).json({ message: 'user not found.' })
        }

        const isMatch = bcrypt.compare(password, existingUser.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'invalid password.' });
        }

        existingUser.lastLoginAt = Date.now();
        existingUser.save();

        console.log("login sucessfull");
        return res.status(200).json({
            message: 'login sucessfull',
            email: existingUser.email,
            employeeId: existingUser.employeeId
        });
    }
    catch (err) {
        return res.status(500).json({message: 'server error during login'});
    }
}

module.exports = { signUp, login };

