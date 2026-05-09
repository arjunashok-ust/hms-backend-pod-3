const mongoose = require('mongoose');
const Counter = require('./Counter');

const employeeSchema = mongoose.Schema({

    email: { type: String, unique: true, required: true },
    employeeId: { type: String, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    department: { type: String, required: true, enum: ['opd', 'ipd', 'lab', 'pharmacy', 'admin'] },
    designation: { type: String, required: true },
    status: { type: Boolean, default: true },
    joiningDate: { type: Date },
    medicalRegistrationNo: { type: String, unique: true },
    specialization: { type: String, required: true },
    qualification: [{ type: String, }],
    consultationFee: { type: Number, required: true },
    availabilitySlots: [{ type: String, required: true }]
})
employeeSchema.pre('save', async function (next) {

    if (this.isNew) {

        try {

            const employeeCounter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.employeeId =
                `EMP-${String(employeeCounter.seq).padStart(6, '0')}`;


        } catch (err) {

            return next(err);

        }
    }

});

module.exports = mongoose.model('Employee', employeeSchema);