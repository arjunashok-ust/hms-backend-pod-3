const mongoose = require('mongoose');
const Counter = require('./counter');
const employeeSchema = new mongoose.Schema({

    employeeCode:{type : String, trim: true, unique : true},
    name :{type : String, required: true},
    email : {type : String, required: true, unique: true},
    phone : {type : String, required : true, unique : true},
    department : {type : String, enum : ["OPD", "IPD", "Lab" ,"Pharmacy", "Admin"]},
    designation : {type : String, enum :["Doctor", "Nurse", "Receptionist","Admin"]},
    status :{type : String, enum :["Active", "Inactive"], default : "Active"},
    joiningDate : {type : Date, required : true},
    medicalRegistrationNo : {type : String, required : true, unique : true},
    specialization : {type : String},
    qualification : [{ type: String }],
    consultationFee : {type : Number},
    availabilitySlots : [{day : String,
        startTime : String,
        endTime : String

    }],

});

employeeSchema.pre('save', async function () {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Employee' },
                { $inc: { seq: 1 } }, 
                { new: true, upsert: true } 
            );
            this.employeeCode = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
});
module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);