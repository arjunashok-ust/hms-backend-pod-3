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
      availabilitySlots,
    } = req.body;

    const existingUser = await Users.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const medicalRoles = ["DOCTOR", "NURSE", "PHARMACIST", "LAB_TECH"];
    if (role && medicalRoles.includes(role.toUpperCase())) {
      if (!medicalRegistrationNo) {
        return res.status(400).json({
          message: "medicalRegistrationNo required",
        });
      }
      const medicalRegNo = await Employees.findOne({
        medicalRegistrationNo: medicalRegistrationNo,
      });
      if (medicalRegNo) {
        return res
          .status(409)
          .json({
            message:
              "Person with this Medical Registration no. already exists.",
          });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newEmployee = await Employees.create({
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
      availabilitySlots,
    });

    const newUser = await Users.create({
      email,
      passwordHash,
      role,
      status,
      employeeID: newEmployee.employeeCode,
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        email: newUser.email,
        employeeID: newEmployee.employeeCode,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email id" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { employeeID: user.employeeID, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    const profile = await Employees.findOne({
      employeeCode: user.employeeID,
    }).select("-__v");

    res.status(200).json({
      message: `Logged in successfully as ${profile.name}`,
      token,
      user: {
        profile,
      },
    });
  } catch (err) {
    console.error("Login error: ", err);
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
            user: profile
        })
    }
    catch {
        console.error("Me error:", err);
        res.status(500).json({ message: err.message });
    }
}