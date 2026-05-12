const mongoose = require("mongoose");
const Counter = require("./Counter");

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    department: {
        type: String,
        enum: [
            "OPD",
            "IPD",
            "LAB",
            "PHARMACY",
            "ADMIN"
        ],
        required: true
    },
    designation: {
        type: String,
        enum: [
            "OWNER",
            "DOCTOR", 
            "NURSE", 
            "RECEPTIONIST",
            "CASHIER", 
            "ADMIN",
            "LAB_TECH", 
            "PHARMACIST"
        ],
        required: true
    },
    status: {
        type: String,
        enum: [ "ACTIVE", "INACTIVE" ],
        required: true
    },
    joiningDate: {
        type: Date,
        required: true
    },
    medicalRegistrationNo: {
        type: String,
        required: true,
        unique: true
    },
    specialization: {
        type: String,
        trim: true,
        lowercase: true
    },
    qualification: [{
        type: String,
        required: true
    }],
    consultationFee: {
        type: Number,
    },
    availabilitySlots: [{
        type: String,
    }]
});

// Pre-save hook to generate sequential ID
employeeSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeId = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            console.log("PreHook error in Employee.js: ",err.message);
        }
    }
});

const employeeModel = mongoose.model("Employee",employeeSchema);
module.exports = employeeModel;