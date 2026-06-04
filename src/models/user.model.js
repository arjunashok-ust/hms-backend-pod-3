const mongoose = require("mongoose");
const Counter = require("./counter.model");

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        status: {
            type: String,
            enum: ["Active", "Inactive", "Pending"],
            required: true,
            default: "Pending",
        },
        role:
        {
            type: String,
            enum: [
                "Admin",
                "Doctor",
                "Receptionist",
                "Cashier",
                "Nurse",
                "Pharmacist",
                "LabTech",
            ],
            required: true,
        },
        employeeId: { type: String, ref: "Employee", required: true },
        lastLoginAt: { type: Date, default: null },
    },
    { timestamps: { createdAt: "created_at" } },
);

module.exports = mongoose.model("Users", userSchema);
