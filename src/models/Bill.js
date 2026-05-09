const mongoose = require("mongoose");
const appointment = require("./appointment");
const Counter = require("./Counter");
const billSchema = new mongoose.Schema(
    {

        billid: {
            type: String
        },

        patientId: {
            type: String
        },

        appointmentId: {
            type: String
        },

        items: [{
            serviceName: {
                type: String
            },
            amount: {
                type: String
            }

        }],

        total: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["PENDING", "PAID", "PARTIAL"],
            required: true
        },

        createdByEmploteeId: {
            type: String,
        }
    }
);

// Pre-save hook to generate sequential ID
billSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'bill' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.billId = `BIL-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
});

module.exports = mongoose.model("Bill", billSchema);