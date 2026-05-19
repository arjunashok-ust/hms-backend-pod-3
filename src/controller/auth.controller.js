const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const mail = require('../utils/mail.utils')

const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const medicalRecord = require('../models/medicalRecord.model');
const Bill = require('../models/bill.model');
const Payment = require('../models/payment.model');

const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model');

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

        if (roles.includes('doctor', 'nurse', 'pharmacist', 'lab_tech')) {
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

        const token = jwt.sign(
            { employeeId: user.employeeId, roles: roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const verification_token = crypto.randomBytes(32).toString("hex");
        const verification_expiry = Date.now() + 60 * 60 * 24;

        await mail.sendMail({
            to: user.email,
            subject: 'HMS System | User Email Verification',
            html: `
            <h1>Hospital Management System</h1><br>
            <p>Thank you ${profile.name} for registering with <b>hms</b>,You can now verify your email by clicking the button below.</p><br>
            <a href="#">
            <input type="Button" value="Verify">
            </a>
            `
        });
        console.log(`verification token sent to ${user.email}`)
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

        const token = jwt.sign(
            {
                email: existingUser.email,
                roles: existingUser.roles,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN })

        console.log("login sucessfull");
        return res.status(200).json({
            message: 'login sucessfull',
            email: existingUser.email,
            token: token
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during login' });
    }
}

// getRoles
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({}, 'role_name');
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

module.exports = { signUp, login, getRoles, getSpecializations,getDepartments };

