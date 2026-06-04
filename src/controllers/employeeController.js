const Employee = require("../models/Employee");
const User = require("../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const sendEmployeeCredentials = require("../utils/mailService");
const sendFormSignupMail = require("../utils/formSignupMail");

// ===============================
// SIGNUP
// ===============================

exports.signup = async (req, res) => {
  try {
    const {
      email,
      name,
      role,
      phone,
      department,
      designation,
      status,
      joiningDate,
      specialization,
      medicalRegistrationNo,
      qualification,
      consultationFee,
      availabilitySlots,
    } = req.body;
    // VALIDATE DOCTOR REGISTRATION NUMBER

    if (["doctor", "nurse", "lab_Tech", "pharmacist"].includes(role)) {
      if (!medicalRegistrationNo) {
        return res.status(400).json({
          success: false,
          message: "Medical Registration Number is required",
        });
      }

      const existingMedicalRegistrationNo = await Employee.findOne({
        medicalRegistrationNo,
      });

      if (existingMedicalRegistrationNo) {
        return res.status(400).json({
          success: false,
          message:
            "Medical Registration Number already exists, provide a different one",
        });
      }
    }

    // CHECK EXISTING EMPLOYEE

    const existEmployee = await Employee.findOne({ email });

    if (existEmployee) {
      return res.status(409).json({
        message: "Email Id Already Registered",
      });
    }

    // CHECK EXISTING USER

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // HASH PASSWORD
    const password_hash = await bcrypt.hash(tempPassword, 12);

    // CREATE EMPLOYEE PROFILE

    const profile = await Employee.create({
      email,
      name,
      phone,
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

    // CREATE USER

    const user = await User.create({
      email,
      status,
      password_hash,
      role,
      employeeId: profile.employeeId,
    });
    return res.status(201).json({
      message: "Employee Registered Successfully",
      employee: profile,
      user: user,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      message: "Server error during signup",
    });
  }
};

// ===============================
// LOGIN
// ===============================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIND USER

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    // CHECK ACCOUNT STATUS

    if (!user.status) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    // VERIFY PASSWORD

    const isPasswordValid = Boolean(
      await bcrypt.compare(password, user.password_hash),
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // GENERATE TOKEN

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );
    user.last_login = new Date();
    await user.save();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error during login",
    });
  }
};
// ===============================
// CURRENT USER
// ===============================

exports.currentUser = async (req, res) => {
  try {
    // FIND USER

    const user = await User.findById(req.user.id).select("-password_hash -__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // FIND EMPLOYEE
    const employee = await Employee.findOne({
      employeeId: user.employeeId,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found",
      });
    }

    // RESPONSE

    if (["doctor", "nurse", "lab_Tech", "pharmacist"].includes(user.role)) {
      return res.status(200).json({
        id: user.employeeId,
        email: user.email,
        role: user.role,
        name: employee.name,
        phone: employee.phone,
        department: employee.department,
        medicalRegistrationNo: employee.medicalRegistrationNo,
        designation: employee.designation,
      });
    }

    return res.status(200).json({
      id: user.employeeId,
      email: user.email,
      role: user.role,
      name: employee.name,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
    });
  } catch (error) {
    console.error("Unable to fetch current user", error);
    return res.status(500).json({ message: error.message });
  }
};
