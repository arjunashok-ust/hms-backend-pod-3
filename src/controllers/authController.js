const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Appointments = require("../models/Appointments");
const Bills = require("../models/Bills");
const Counter = require("../models/Counter");
const Employees = require("../models/Employees");
const MedicalRecords = require("../models/MedicalRecords");
const Patients = require("../models/Patients");
const Payments = require("../models/Payments");
const Users = require("../models/Users");

exports.signup = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            status,
            role,
            phone,
            department,
            designation,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        } = req.body;

        const existingUser = await Users.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" })
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
        );

        try {
            const verifyUrl = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${verificationToken}`;
            await sendEmail({
                to: req.body.email,
                subject: "HMS — Verify Your Email",
                html: `
            <h2>Welcome to HMS</h2>
            <p>Hi ${req.body.firstName}, thank you for registering.</p>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
            <p>This link expires in <strong>24 hours</strong>.</p>
            <p>If you did not create an account, please ignore this email.</p>
          `,
            });
        }
        catch (err) {
            console.error("Email sending failed.", err);
            return res.status(500).json({ message: "Email sending failed.Could not create profile" })

        }

        const passwordHash = await bcrypt.hash(password, 12);

        const employeeProfile = await Employees.create({
            email,
            name,
            status,
            role,
            phone,
            department,
            designation,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        })

        const userProfile = await Users.create({
            email,
            passwordHash,
            role,
            status,
            employeeID: employeeProfile.employeeCode,
            verificationToken,
            verificationTokenExpiry
        })

        const token = jwt.sign(
            { id: userProfile._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        res.status(201).json({
            message: "Account created successfully",
            token,
            user: {
                id: userProfile._id,
                email: userProfile.email,
                employeeID: employeeProfile.employeeID,
                // isVerified: userProfile.isVerified    // Uncomment when verificqation implemented
            }
        });
    }
    catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: err.message });
    }
}

exports.login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email id" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Verify emal before logging in"
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );

        const profile = await Employees.findOne({ employeeCode: user.employeeID })
            .select("-__v")

        res.status(200).json({
            message: "Login",
            token,
            user: {
                profile
            }
        });
    }
    catch (err) {
        console.error("Login error: ", err);
        res.status(500)
            .json({ message: err.message });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;
        const user = await Users.findOne({ email: email });
        if (!user) {
            console.log("Accout not found")
            return res.status(404).json({ message: "Account not found" })
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            console.log("Password mismatch")
            return res.status(400).json({ message: "Incorrect password" })
        }

        const deletedEmployee = await Employees.findOneAndDelete({ email: email });
        await Users.findOneAndDelete({ email: email });

        res.status(201).json({
            message: "Profile deleted successfully",
            Profile: deletedEmployee
        });

    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await Users.findById(req.user.id).select("-__v -passwordHash")
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const profile = await Employees.findOne({ email: user.email }).select("-__v");
        res.status(200).json({
            user:profile
        })
    }
    catch {
        console.error("Me error:", err);
        res.status(500).json({ message: err.message });
    }
}