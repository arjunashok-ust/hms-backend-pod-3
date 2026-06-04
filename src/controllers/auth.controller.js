const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const employeeModel = require("../models/Employee");
const userModel = require("../models/User");
const medicRoles = new Set(["DOCTOR", "NURSE", "LAB_TECH", "PHARMACIST"]);

//SIGNUP
exports.signUp = async (req, res) => {
    try {
        const {
            name, email, password, phone, department, designation,
            joiningDate, medicalRegistrationNo,
            specialization, qualification, consultationFee,
            availabilitySlots, roles
        } = req.body;

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "The user is already registered"
            });
        }

        if (medicRoles.has(roles)) {
            const medicRegNo = await employeeModel.findOne({ medicalRegistrationNo });
            if (medicRegNo) {
                return res.status(409).json({
                    success: false,
                    message: 'medical registration no should be unique.'
                });
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const employee = await employeeModel.create({
            name,
            email,
            phone,
            department,
            designation,
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
            roles,
            employeeId: employee.employeeId
        });

        res.status(200).json({
            success: true,
            message: "Register Sucessful",
            user: {
                id: user._id,
                email: user.email,
                role: user.roles
            },
        });
    } catch (err) {
        console.error("Signup error: ", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

//LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }
        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        user.lastLoginAt = Date.now();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.roles
            }
        });
    } catch (err) {
        console.error("Login error: ", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}