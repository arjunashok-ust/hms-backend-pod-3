const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/User");

const Employee = require("../models/Employee");


//Sign up

exports.signup = async (req, res) => {
    try {
        const {
            name,
            email,
            role,
            password,
            phone,
            department,
            designation,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            availabilitySlots
        } = req.body;


        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(409).json({ message: "Email already registered." });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const employee = await Employee.create(
            {
                name,
                email,
                phone,
                department,
                designation,
                joiningDate,
                medicalRegistrationNo,
                specialization,
                qualification,
                availabilitySlots
            }
        );

        const user = await User.create(
            {
                email,
                passwordHash: password_hash,
                role,
                employeeid: employee.employeeCode
            }
        );

        return res.status(201).json({
            message: "Employee created successfully",
            employee,
            user
        })

    } catch (error) {
        console.error("Signnup error:", error);
        res.status(500).json({ message: "Server error during signup" });
    }
}

//login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        user.lastLoginAt = new Date();
        await user.save();


        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};

//get current user
exports.currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt
            }
        })

    } catch (error) {
        console.error("Unable to fetch current user", error);
        res.status(500).json({ message: error.message });
    }
};
