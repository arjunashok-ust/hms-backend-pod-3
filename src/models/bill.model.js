const mongoose = require('mongoose');
const Counter = require('./counter.model');

const billSchema = new mongoose.Schema({
    billId: { type: String, required: true, unique: true },
    patientId: { type: String, ref: 'Patients', required: true },
    appointmentId: { type: String, ref: 'Appointments', required: true },
    items: [{
        serviceName: { type: String, required: true },
        amount: { type: Number, required: true },
    }],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'partial'] },
    createdByEmployeeId: { type: String, ref: 'Employee', required: true },
});

// pre hook
billSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'bill' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true },
            );

            this.billId = `BILL-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.err("bill model pre hook error : "+err);
            throw err;
        }
    }
    next();
})

module.exports = mongoose.model('Bills', billSchema);