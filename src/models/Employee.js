const mongoose = require("mongoose");

const Counter = require("./Counter");
const employeeSchema = new mongoose.Schema(
    {
        employeeCode: {
            type: String,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        department: {
            type: String,
            //enum: ["OPD", "IPD", "Lab", "Pharmacy", "Admin"],
            required: true
        },

        designation: {
            type: String,
            //enum : ["Doctor", "Nurse", "Receptionist"],
            required: true
        },

        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
            required: true,
        },

        joiningDate: {
            type: Date,
            required: true
        },

        medicalRegistrationNo: {
            type: String,
            unique: true,
            sparse: true
        },

        specialization: {
            type: String,
        },

        qualification: [{
            type: String,

        }],

        consultationFee: {
            type: Number,
            default: 0
        },

        availabilitySlots: [{
            type: String,
        }]
    },
);

// Pre-save hook to generate sequential ID
employeeSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeCode = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
});

module.exports = mongoose.model("Employee", employeeSchema);
