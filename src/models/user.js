const mongoose = require('mongoose');
const userSchemea = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["Active", "Inactive"] },
    isVerified:{type: Boolean, required:true},
    verification_token:{type : String},

    verification_expiry:{type: String},
    roles: {
        type: String,
        enum: ["Owner", "Admin", "Doctor", "Receptionist", "Cashier", "Nurse", "Lab_tech", "Pharmicist"],
        
    },
    employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
},
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: Date.now }
});
module.exports =
mongoose.models.User ||
mongoose.model('User', userSchemea);