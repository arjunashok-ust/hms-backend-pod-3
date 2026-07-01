const mongoose = require("mongoose");
const Patient = require("./Patient");
const Counter = require("./Counter");

const appointmentSchema = mongoose.Schema({
  patientId: {
    type: String,
    ref: Patient,
    required: true,
  },
  doctorEmployeeId: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["PENDING", "BOOKED", "CANCELLED", "COMPLETED"],
    default: "PENDING",
  },
  createdByEmployeeId: {
    type: String,
    default: null,
  },
  appointmentId: {
    type: String,
    unique: true,
  },
});

appointmentSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "appointment" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    this.appointmentId = `APPT-${String(counter.seq).padStart(6, "0")}`;
  }
});

/* Indexes on the hot query fields used by list/enrichment/slot-conflict queries. */
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ date: 1 });
/* Compound index covers both the slot-conflict lookup (doctor+date+timeSlot)
   and plain doctor-scoped queries (leftmost prefix doctorEmployeeId). */
appointmentSchema.index({ doctorEmployeeId: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
