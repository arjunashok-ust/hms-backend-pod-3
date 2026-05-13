const mongoose = require("mongoose");
const Counter = require("./Counter");

const billSchema = new mongoose.Schema({
    billId: {
        type: String,
        required: true,
        unique: true
    },
    patientId: {
        type: String,
        ref: "Customer",
        required: true
    },
    appointmentId: {
        type: String,
        ref: "Appointment"
    },
    items: [{
        serviceName: { type: String, required: true },
        amount: { type: Number, required: true },
        required: true
    }],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIAL"],
        required: true
    },
    createdByEmployeeId: {
        type: String,
        ref: "Employee",
        required: true
    }
})

// Pre-save hook to generate sequential ID
billSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'bill' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.billId = `BILL-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

const billModel = mongoose.model("Bill", billSchema);