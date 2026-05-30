const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const appointmentsSchema = new mongoose.Schema({
    appointmentCode: { type: String, unique: true },
    patientID: {
        type: String,
        ref: "Patients",
        required: true
    },
    doctorEmployeeID: {
        type: String,
        ref: "Employees",
        required: true
    },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, enum: ["Scheduled", "Completed", "Cancelled"], default: "Scheduled" },
    createdByEmployeeID: { type: String, ref: "Employees" }
}, { timestamps: true });

appointmentsSchema.pre("save", async function () {
    if (this.isNew) {
        this.appointmentCode = await generateId("appointment", "APT");
    }
});

module.exports = mongoose.model("Appointments", appointmentsSchema);
