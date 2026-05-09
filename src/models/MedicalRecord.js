const mongoose = require("mongoose");
const Counter = require("./Counter");

const medicalRecordSchema = new mongoose.Schema({
    medicalRecordId: {
        type: String,
        unique: true,
        required: true
    },
    appointmentId: {
        type: String,
        required: true,
        ref: "Appointment"
    },
    patientId: {
        type: String,
        required: true,
        ref: "CUstomer"
    },
    doctorEmployeeId: {
        type: String,
        required: true,
        ref: "Employee"
    },
    symptoms: {
        type: String,
        required: true
    },
    diagnosis: {
        type: String,
        required: true
    },
    prescriptionItems: [{
        name: { type: String,required: true },
        dosage: { type: String,required: true },
        duration: { type: String, required: true },
        required: true
    }],
    notes: {
        type: String,
        required: true
    },
}, {
    timestamps: {
        createdAt: "createdAt"
    }
});
const medicalRecordModel = mongoose.model("MedicalRecord",medicalRecordSchema);