const mongoose = require('mongoose');
const Counter = require('./counter.model');

const patientSchema = new mongoose.Schema({
    uhid: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, default: null},
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    dob: { type: Date, required: true },
    address: { type: String, required: true },
    emergencyContact: { type: String, default: null },
});

// pre hook
patientSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'patient' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true },
            );
            this.uhid = `PAT-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
             console.error("patient model pre hook error : "+err);
            throw (err);
        }
    }
});

module.exports = mongoose.model('patients', patientSchema);