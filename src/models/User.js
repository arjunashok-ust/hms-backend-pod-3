const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    passwordHash: {
        type: String,
        required: true
    },

    status: {
        type: String, 
        enum: ["ACTIVE", "INACTIVE", "PENDING"],
        default: "PENDING",
    },

    isFirstLogin: {
        type: Boolean,
        default: false,
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    role: {
        type: String, 
        enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST"],
        required: true
    },

    employeeId: {
        type: String,
        required: true
    },

    lastLoginAt: {
        type: Date,
        default: null
    },
    verification_token: {
        type: String,
        default: null,
    },

    verification_expiry: {
        type: Date,
        default: null
    }
},
    {
        timestamps: {
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    }
);

module.exports = mongoose.model("User", userSchema);