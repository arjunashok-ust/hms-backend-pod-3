const mongoose = require('mongoose');
const Counter = require('./counter.model');

const paymentSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    billId: { type: String, ref: 'Bill', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'upi'] },
    paidAt: { type: Date, required: true },
    receivedByEmployeeId: { type: String, ref: 'Employee', required: true },
});

// pre hook
paymentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'payment' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.paymentId = `PAY-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.err("payment model pre hook error : " + err);
            throw err;
        }
    }
    next();
})

module.exports = mongoose.model('Payments', paymentSchema);
