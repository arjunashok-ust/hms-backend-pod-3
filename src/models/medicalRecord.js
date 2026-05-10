const mongoose = require('mongoose');
const medicalRecordchema = new mongoose.Schema({
    medicalRecordId : { type : String, required : true, unique : true},
    appointmentId : { type : mongoose.Schema.types.ObjectId,
        ref : 'Appointment',
        required : true
    },

    patientId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Patient',
        required : true
    },
    doctorEmployeeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Employee',
        required : true
    },
    symptoms : { type : String, required : true},
    diagnosis : { type : String, required : true},
    prescriptionItems :{ type : [{name : String, dosage : String, duration : String}]},
    notes : { type : String},
    createdAt : { type : Date, default : Date.now}
});


medicalRecordSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'medicalRecord' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.medicalRecordId = `MR-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('MedicalRecord', medicalRecordchema);



 
// id
// appointmentId
// patientId
// doctorEmployeeId
// symptoms
// diagnosis
// prescriptionItems[] (name, dosage, duration)
// notes
// createdAt