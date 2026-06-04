const Patient = require("../models/Patients");
const User = require("../models/Users");
const bcrypt = require("bcryptjs");

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching patients", error: err.message });
  }
};

exports.createPatient = async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating patient", error: err.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Patient.findOneAndUpdate({ UHID: id }, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Patient.findOneAndDelete({ UHID: id });
    if (!deleted) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

exports.createPatientFromMobile = async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      email,
      gender,
      dob,
      emergencyContact,
      address,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: " Email already registered as an user already." });
    }
    const existingPatient = await Patient.findOne({ email: email });
    if (existingPatient) {
      return res.status(409).json({
        message: "Patient profile with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    try {
      const newPatient = await Patient.create({
        name,
        phone,
        email,
        gender,
        dob,
        emergencyContact,
        address,
      });

      const newUser = await User.create({
        email,
        passwordHash,
        role: "PATIENT",
        status: "ACTIVE",
        patientID: newPatient.UHID,
      });
      return res.status(200).json({
        message: "Patient registered successfully",
        patientUHID: newUser.patientID,
      });
    } catch (err) {
      console.log(err.message);
    }
  } catch (err) {
    console.error("Registration Error:", err);
    res
      .status(500)
      .json({ message: "Error registering patient", error: err.message });
  }
};
