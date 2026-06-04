const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Employee = require('../models/employee.model');
const User = require('../models/user.model');

const medicalRoles = new Set(['Doctor', 'Nurse', 'Pharmacist', 'LabTech']);

// SignUp
const signUp = async (req, res) => {
    try {
        const {
            name,
            role,
            email,
            password,
            department,
            designation,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        if (!role) {
            return res.status(400).json({ message: 'Role is required.' });
        }

        if (medicalRoles.has(role)) {
            if (!medicalRegistrationNo) {
                return res.status(400).json({ message: 'Medical registration no is required for this role.' });
            }

            const existingMedicalRegistrationNo = await Employee.findOne({
                medicalRegistrationNo: medicalRegistrationNo,
            });

            if (existingMedicalRegistrationNo) {
                return res.status(409).json({ message: 'Medical registration no should be unique.' });
            }
        }

        const status = 'Pending';

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
            availabilitySlots,
        });

        if (!profile) {
            return res.status(500).json({ message: "Failed to create employee profile" });
        }

        const user = await User.create({
            email: email,
            passwordHash: passwordHash,
            status: status,
            role: role,
            employeeId: profile.employeeCode,
        });

        // 201 created
        return res.status(201).json({
            message: 'Account created sucessfully.',
            email: user.email,
            role: user.role,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during signup' });
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, existingUser.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password.' });
        }

        existingUser.lastLoginAt = Date.now();
        await existingUser.save();

        const token = jwt.sign(
            { id: existingUser.employeeId, role: existingUser.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );

        return res.status(200).json({
            message: 'login sucessfull',
            email: existingUser.email,
            token: token,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = { signUp, login };
