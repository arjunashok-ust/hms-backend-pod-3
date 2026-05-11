const mongoose = require('mongoose');
const Counter = require('./counter.model');

const medicalRecordSchema = new mongoose.Schema({
    medicalRecordId: { type: String, unique: true, required: true },
    appointmentId: { type: String, ref: 'Appointments', required: true },
    patientId: { type: String, ref: 'Patients', required: true },
    doctorEmployeeId: { type: String, ref: 'Employee', required: true },
    symptoms: { type: String, required: true },
    diagnosis: { type: String, required: true },
    prescriptionItems: [
        {
            name: { type: String, required: true },
            dosage: { type: String, required: true },
            duration: { type: String, required: true },
        }
    ],
    notes: { type: String },
},
{timestamps: {createdAt: 'created_at'}}
);

// pre hook
medicalRecordSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'medicalRecord' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.medicalRecordId = `MED-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.error("medical record model pre hook error : "+err);
            throw err;
        }
    }
})

module.exports = mongoose.model('MedicalRecordSchema', medicalRecordSchema);