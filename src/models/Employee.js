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
        lowercase: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    department: {
        type: String,
        enum: [
            "OPD",
            "IPD",
            "LAB",
            "PHARMACY",
            "ADMINISTRATION"
        ],
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "PENDING"],
        default: "INACTIVE"
    },
    joiningDate: {
        type: Date,
        required: true
    },
    medicalRegistrationNo: {
        type: String,
    },
    specialization: {
        type: String,
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
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.employeeId = `EMP-${String(counter.seq).padStart(6, '0')}`; 
        } catch (err) {
            console.log("PreHook error in Employee.js: ", err.message);
        }
    }
});

const employeeModel = mongoose.model("Employee", employeeSchema);
module.exports = employeeModel;