const mongoose = require("mongoose");
const Counter = require("./Counter");

const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        unique: true,
        required: true
    },
    billId: {
        type: String,
        ref: "Bill",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ["CASH", "CARD", "UPI"],
        required: true
    },
    paidAt: {
        type: Date,
        required: true
    },
    receivedByEmployeeId: {
        type: String,
        ref: "Employee",
        required: true
    }
});

// Pre-save hook to generate sequential ID
PaymentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'payment' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.paymentId = `PAY-${String(counter.seq).padStart(6, '0')}`;
        } catch (err) {
            return next(err);
        }
    }
    next();
});


const paymentModel = mongoose.model("Payment", paymentSchema);