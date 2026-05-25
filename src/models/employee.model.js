const mongoose = require('mongoose');
const Counter = require('./counter.model');

const employeeSchema = new mongoose.Schema({
    employeeCode: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, enum: ['OPD', 'IPD', 'Lab', 'Pharmacy', 'Admin','ICU'], required: true },
    designation: { type: String, enum: ['Doctor', 'Nurse', 'Receptionist', 'Owner', 'Lab_Tech', 'Cashier', 'Pharmacist'], required: true },
    status: { type: String, enum: ['Active', 'Inactive','Rejected'], required: true },
    joiningDate: { type: Date, required: true },
    medicalRegistrationNo: { type: String ,sparse: true},
    specialization: { type: String },
    qualification: { type: String },
    consultationFee: { type: Number },
    availabilitySlots: [{ type: String }],
});

// pre hook
employeeSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.employeeCode = `EMP-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.error("employee model pre hook error : " + err);
            throw (err);
        }
    }
});

module.exports = mongoose.model('Employees', employeeSchema);