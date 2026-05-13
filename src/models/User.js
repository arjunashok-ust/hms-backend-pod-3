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
        type: String, enum: ["ACTIVE", "INACTIVE"],
        default: "ACTIVE",
        required: true
    },

    role: {
        type: String,
        enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST"],
        required: true
    },

    employeeid: {
        type: String
    },

    lastLoginAt: {
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