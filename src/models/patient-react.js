const mongoose = require("mongoose");
const Counter = require("./Counter");

const patientSchemaAPI = mongoose.Schema({
    email: {
  type: String,
  unique: true,
  required: true,
},

password: {
  type: String,
  required: true,
},

  UHID: {
    type: String,
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
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },

  allergies: [
    {
      type: String,
      trim: true,
    },
  ],

  address: {
    line1: String,
    city: String,
    postcode: String,
  },

  emergencyContact: {
    type: String,
    unique: true,
    trim: true,
  },

  status: {
    type: Boolean,
    default: true,
  },
});

patientSchemaAPI.pre("save", async function () {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { name: "patient" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    this.UHID = `UHID-${String(counter.seq).padStart(6, "0")}`;
  }
});

module.exports = mongoose.model("PatientAPI", patientSchemaAPI);

 