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
