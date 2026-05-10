const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
    appointmentId : {type : String, required : true},
    patientId:{
        reftype : mongoose.Schema.Types.ObjectId,
        ref : 'Patient',
        required : true
    },
    doctorEmployeeId : {
        reftype : mongoose.Schema.Types.ObjectId,
        ref : 'Employee',
        required : true
    },
    date : { type : Date, required : true},
    timeSlot : { type : String, required : true},
    status : { type : String, enum :["BOOKED", "CANCELLED", "COMPLETED"]},
    createdByEmployeeId : {
        reftype : mongoose.Schema.Types.ObjectId,
        ref : 'Employee'
    }



    });
    appointmentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Appointment' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.appointmentId = `APP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});

    module.exports = mongoose.model('Appointment', appointmentSchema);







// id
// patientId → Patient
// doctorEmployeeId → Employee (designation Doctor)
// date
// timeSlot
// status → BOOKED | CANCELLED | COMPLETED
// createdByEmployeeId → Employee (Receptionist / Admin)