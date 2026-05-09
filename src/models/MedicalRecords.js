const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const medicalRecordSchema = new mongoose.Schema({
    recordCode: { type: String, unique: true },
    appointmentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointments",
        required: true,
        unique: true
    },
    patientID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patients",
        required: true,
    },
    doctorEmployeeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employees",
        required: true,
    },
    symptoms: { type: String, required: true, },
    diagnosis: { type: String, required: true },
    prescriptionItems: [
        {
            medicineName: String,
            dosage: String,
            duration: String
        }
    ],
    notes: { type: String }
}, {
    timestamps: true
});

medicalRecordSchema.pre("save", async function () {
    if (this.isNew) {
        this.recordCode = await generateId("medicalRecord", "MR");
    }
});

module.exports = mongoose.model("MedicalRecords", medicalRecordSchema);