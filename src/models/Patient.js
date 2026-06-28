const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchema = mongoose.Schema({
  UHID: {
    type: String,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    unique: true,
    trim: true,
  },

  gender: {
    type: String,
    required: true,
  },

  date_of_birth: {
    type: Date,
  },

  bloodGroup: {
    type: String,
  },

  allergies: [
    {
      type: String,
    },
  ],

  address: {
    line1: String,
    city: String,
    postcode: String,
  },

  emergencyContact: {
    type: String,
    trim: true,
    default: null,
  },

  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

patientSchema.pre("save", async function () {
  try {
    if (this.isNew) {
      const counter = await Counter.findOneAndUpdate(
        { name: "patient" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );

      this.UHID = `UHID-${String(counter.seq).padStart(6, "0")}`;
    }
  } catch (err) {
    console.error("Error generating UHID:", err);
    throw err;
  }
});
module.exports = mongoose.model("Patient", patientSchema);
