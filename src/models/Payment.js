const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {

        paymentId: {
            type: String,
            required: true,
            unique: true
        },

        billId: {
            type: String
        },

        amount: {
            type: Number,
            default: 0
        },

        method: {
            type: String,
            enum: ["CASH", "CARD", "UPI"],
        },

        paidAt: {
            type: Date,
            default: Date.now()
        },

        revceivedByEmplyeeId: {
            type: String
        }

    }
)

// Pre-save hook to generate sequential ID
paymentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'payment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.paymentId = `PAY-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
});

module.exports = mongoose.model("Payment", paymentSchema);