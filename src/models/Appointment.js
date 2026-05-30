const mongoose = require("mongoose");
const Counter = require("./Counter");

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
        type: String,
        unique: true
    },
    patientId: {
        type: String,
        ref: "Customer",
        required: true
    },
    doctorEmployeeId: {
        type: String,
        ref: "Employee",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["BOOKED", "CANCELLED", "COMPLETED"],
        required: true
    },
    createdByEmployeeId: {
        type: String,
        ref: "Employee",
        required: true
    }
});

// Pre-save hook to generate sequential ID
appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'appointment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.appointmentId = `APP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            console.log("PreHook error in Appointment.js: ", err.message);
        }
    }
});

module.exports = mongoose.model("Appointment", appointmentSchema);