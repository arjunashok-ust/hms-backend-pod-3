const Patient = require("../models/Patients");

exports.getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });
        res.status(200).json(patients);
    } catch (err) {
        res.status(500).json({ message: "Error fetching patients", error: err.message });
    }
};

exports.createPatient = async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (err) {
        res.status(400).json({ message: "Error creating patient", error: err.message });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Patient.findOneAndUpdate({ UHID: id }, req.body, { new: true });
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