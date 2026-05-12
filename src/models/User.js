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
        enum: [ "ACTIVE", "INACTIVE" ],
        required: true
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
    lastLoginAt: {
        type: Date,
        required:true
    }
}, {
    timestamps: {
        createdAt: "createdAt"
    }
});

const userModel = mongoose.model("User",userSchema);
module.exports = userModel;