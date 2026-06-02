const Patient = require("../models/patient-react");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//  SIGNUP
exports.patientSignup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      bloodGroup,
      emergencyContact,
      address,
    } = req.body;

    // check existing user
    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const patient = new Patient({
      name,
      email,
      password: hashedPassword,
      phone,
      gender,
      date_of_birth,
      bloodGroup,
      emergencyContact,
      address,
    });

    await patient.save();

    res.status(201).json({
      message: "Patient registered successfully",
      data: patient,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  LOGIN
exports.patientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: patient._id, role: "patient" },
      "SECRET_KEY", // move to env later
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      patient,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  UPDATE PROFILE
exports.updatePatientProfile = async (req, res) => {
  try {
    const update = await Patient.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Profile updated",
      data: update,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};