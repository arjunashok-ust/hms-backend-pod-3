const mongoose = require('mongoose');
const Counter = require('./counter.model');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive','Pending'], required: true, default: 'Inactive' },
    role: { type: String, enum: ['Owner', 'Admin', 'Doctor', 'Receptionist', 'Cashier', 'Nurse', 'Lab_Tech', 'Pharmacist'], required: true },
    employeeId: { type: String, ref: 'Employee', required: true },
    verification_token: { type: String, unique: true },
    verification_expiry: {type: Date},
    isVerified: {type: Boolean,default: false},
    firstLogin: {type: Boolean,default: true},
    lastLoginAt: { type: Date, default: null }
},
    { timestamps: { createdAt: 'created_at' } }
);

module.exports = mongoose.model('Users', userSchema);