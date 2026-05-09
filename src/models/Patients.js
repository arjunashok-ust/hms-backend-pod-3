const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const patientSchema = new mongoose.Schema({
    UHID: {type: String,unique: true},
    name: {type: String,required: true,trim: true},
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]{10}$/, "Phone must be 10 digits"]
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    gender: {type: String,enum: ["Male", "Female", "Other"],required: true},
    dob: {type: Date,required: true},
    emergencyContact: {type: String,required: true},
    status: {type: Boolean,default: true},
    address: {
        line1: { type: String, required: true },
        line2: { type: String },
        state: { type: String, required: true },
        pincode: { type: Number, required: true }
    }
}, { timestamps: true });


patientSchema.pre("save", async function () {
    if (this.isNew) {
        this.UHID = await generateId("patient", "UHID");
    }
});

module.exports = mongoose.model("Patients", patientSchema);