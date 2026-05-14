const mongoose = require('mongoose');
const Counter = require('./counter.model');

const employeeSchema = new mongoose.Schema({
    employeeCode: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, enum: ['opd', 'ipd', 'lab', 'pharmacy', 'admin'], required: true },
    designation: { type: String, enum: ['doctor', 'nurse', 'receptionist', 'owner', 'lab_tech', 'cashier', 'pharmacist'], required: true },
    status: { type: String, enum: ['active', 'inactive'], required: true },
    joiningDate: { type: Date, required: true },
    medicalRegistrationNo: { type: String },
    specialization: { type: String },
    qualification: [{ type: String, enum: ['MBBS', 'MD'], required: true }],
    consultationFee: { type: Number },
    availabilitySlots: {
        startTime: { type: String },
        endTime: { type: String }
    },
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