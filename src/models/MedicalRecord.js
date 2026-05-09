const mongoose = require("mongoose");
const appointment = require("./appointment");

const medicalRecordSchema = new mongoose.Schema({

    appointmentId: {
        type: String
    },

    patientId: {
        type: String
    },

    doctorEmployeeId: {
        type: String
    },

    symptoms: {
        type: String
    },

    diagnosis: {
        type: String
    },

    prescriptionItems: [
        {
            name: {
                type: String,
            },
            dosage: {
                type: String
            },
            duration: {
                type: String
            },
        }
    ],

    notes: {
        type: String
    }

},
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);