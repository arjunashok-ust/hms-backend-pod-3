const mongoose = require("mongoose");
const Patient = require("./Patient");
const Counter = require("./Counter");
const appointmentSchema = mongoose.Schema({
  patientId: { type: String, ref: Patient, required: true },
  doctorEmployeeId: { type: String },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: {
    type: String,
    enum: ["BOOKED", "CANCELLED", "COMPLETED"],
    default: "BOOKED",
  },
  createdByEmployeeId: { type: String, required: true },
  appointmentId: { type: String, unique: true },
});



appointmentSchema.pre('save', async function () {

  if (this.isNew) {

    const counter = await Counter.findOneAndUpdate(
      { name: 'appointment' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.appointmentId =
      `APPT-${String(counter.seq).padStart(6, '0')}`;
  }

});

module.exports = mongoose.model("Appointment", appointmentSchema);
