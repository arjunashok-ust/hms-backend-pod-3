const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    passwordHash: { type: String, required: true },
    status: { type: Boolean, default: true },
    role: { type: String, required: true },
    employeeID: { type: String, ref: "Employees" },
    lastLogin: { type: Date, default: null },
    verificationToken: { type: String, default: null },
    verificationTokenExpiry: { type: Date, default: null },
    isVerified: {type: Boolean, default : false}
}, { timestamps: true });

module.exports = mongoose.model("Users", userSchema);
