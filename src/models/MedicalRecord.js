const mongoose = require("mongoose");
const Counter = require("./Counter"); // adjust path

const medicalRecordSchema = new mongoose.Schema(
  {
    recordCode: { type: String },
    doctorEmployeeId: { type: String, required: true },
    appointmentId: { type: String, required: true },
    patientId: { type: String, required: true },
    visitDate: { type: Date, default: Date.now },
    diagnosis: { type: String },
    complaint: { type: String },
    symptoms: { type: String },
    medications: [
      {
        name: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
        deliveryMethod: { type: String },
      },
    ],
    medicalObservations: [
      {
        metricName: { type: String },
        metricValue: { type: String },
        recordedTime: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    status: {
      type: String,
      enum: ["FINAL", "DRAFT", "DELETED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

medicalRecordSchema.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "medicalRecord" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    this.recordCode = `MR-${String(counter.seq).padStart(6, "0")}`;
  }
});

medicalRecordSchema.index({ recordCode: 1 }, { unique: true });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ doctorEmployeeId: 1, visitDate: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);