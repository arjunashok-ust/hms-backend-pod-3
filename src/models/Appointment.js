const mongoose = require("mongoose");
const Counter = require("./Counter");
const appointmentSchema = new mongoose.Schema(
    {

        appointmentId: {
            type: String
        },

        patientId: {
            type: String
        },

        doctorEmployeeId: {
            type: String
        },

        date: {
            type: Date,
            required: true,
        },

        timeSlot: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["BOOKED", "CANCELLED", "COMPLETED"],
            default: "BOOKED",
            required: true,
        },
        //
        createdByEmployeeId: {
            type: String
        },
    }
);

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
            return next(err);
        }
    }
});


module.exports = mongoose.model("Appointment", appointmentSchema);