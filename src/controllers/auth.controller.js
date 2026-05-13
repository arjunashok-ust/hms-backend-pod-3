const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const employeeModel = require("../models/Employee");
const userModel = require("../models/User");

//SIGNUP
exports.signUp = async (req, res) => {
    try {
        const {
            name, email, password, department, designation,
            status, joiningDate, medicalRegistrationNo,
            specialization, qualification, consultationFee,
            availabilitySlots, lastLoginAt
        } = req.body;

        const existingUser = await employeeModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "The employee is already registered" });
        }

        if (roles.includes("DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST")) {
            const medicRegNo = employeeModel.findOne(medicalRegistrationNo);
        }

        if (medicalRegistrationNo) {
            return res.status(409).json({ message: 'medical registration no should be unique.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const employee = await employeeModel.create({
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
        const user = await userModel.create({
            email,
            passwordHash,
            status,
            roles: designation,
            employeeId: employee.employeeId,
            lastLoginAt
        });

        res.status(201).json({
            message: "Register Sucessful",
            user: {
                id: user._id,
                email: user.email,
                role: user.roles
            },
        });
    } catch (err) {
        console.log("Signup error: ", err);
        res.status(500).json({ message: err.message });
    }
}

//LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const passwordMatch = Boolean(await bcrypt.compare(password, user.passwordHash));
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.roles
            }
        });
    } catch (err) {
        console.log("Login error: ", err);
        res.status(500).json({ message: err.message });
    }
}

//profile
exports.profile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                role: user.roles,
                last_login: user.lastLoginAt,
                created_at: user.createdAt,
            }
        });
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).json({ message: err.message });
    }
}