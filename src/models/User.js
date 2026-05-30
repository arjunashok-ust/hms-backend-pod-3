const mongoose = require("mongoose");
const Counter = require("./Counter");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE"],
        required: true,
        default: "INACTIVE"
    },
    roles: {
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
    employeeId: {
        type: String,
        ref: "Employee"
    },
    verificationToken: {
        type: String,
        unique: true
    },
    verificationExpiry: {
        type: Date
    },
    isActivated: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    firstLogin: {
        type:Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: {
        createdAt: "createdAt"
    }
});

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;