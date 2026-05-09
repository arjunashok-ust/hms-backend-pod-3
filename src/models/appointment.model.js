const mongoose = require('mongoose');
const Counter = require('./counter.model');


const appointmentSchema = new mongoose.Schema({
    appointmentId: { type: String, unique: true, required: true },
    patientId: { type: String, ref: 'Patients', required: true },
    doctorEmployeeId: { type: String, ref: 'Employees', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, enum: ['booked', 'cancelled', 'completed'], required: true },
    createdByEmployeeId: { type: String, ref: 'Employees', required: true },
});

// pre hook
appointmentSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'appointment' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true },
            );

            this.appointmentId = `APP-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.err("appointment model pre hook error : " + err);
            throw err;
        }
    }
});

module.exports = mongoose.model('Appointments', appointmentSchema);

