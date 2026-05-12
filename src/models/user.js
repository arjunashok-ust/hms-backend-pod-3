const mongoose = require('mongoose');
const userSchemea = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"] },
    roles: {
        type: String,
        enum: ["Owner", "Admin", "Doctor", "Receptionist", "Cashier", "Nurse", "Lab_tech", "Pharmicist"],
        
    },
    employeeId: {
        type: String,
        ref: 'Employee',
    },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchemea);