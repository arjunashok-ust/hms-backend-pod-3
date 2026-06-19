const mongoose = require("mongoose");
const Counter = require("./counter.model");

const MedicalRecordSchema = new mongoose.Schema(
    {
        medicalRecordId: { type: String, unique: true },
        doctorId: { type: String, required: true },
        appointmentId: { type: String, required: true },
        patientId: { type: String, required: true },
        complaint: { type: String, required: true },
        symptoms: { type: String, required: true },
        diagnosis: { type: String, required: true },
        medications: [
            {
                name: { type: String },
                dosage: { type: String },
                frequency: { type: String },
                duration: { type: String },
            },
        ],
        medicalObservation: [
            {
                metricName: { type: String },
                metricValue: { type: String },
                recordedTime: { type: Date },
            },
        ],
        notes: { type: String },
        createdBy: { type: String, required: true },
        updatedBy: { type: String },
        updatedAt: { type: Date },
        status: { type: String , enum: ['Draft','Final','Deleted']},
    },
    { timestamps: { createdAt: "created_at" } },
);

// pre hook
MedicalRecordSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'medicalRecord' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.medicalRecordId = `REC-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.error("Medical record model pre hook error : " + err);
            throw (err);
        }
    }
});

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
