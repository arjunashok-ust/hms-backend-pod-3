const mongoose=require('mongoose');
const Patient = require('./Patient');

const appointmentSchema=mongoose.Schema({
    patientId:{type:String,ref:Patient,required:true},
    doctorEmployeeId:{type:String},
    date:{type:Date,required:true},
    timeSlot:{type:String,required:true},
    status:{type:String,enum:['BOOKED','CANCELLED','COMPLETED'],default:'BOOKED'},
    createdByEmployeeId:{type:String,required:true},
    appointmentId:{type:String,unique:true}
})
appointmentSchema.pre('save', async function (next) {

    if (this.isNew) {

        try {

            const counter = await Counter.findOneAndUpdate(

                { name: 'appointment' },

                { $inc: { seq: 1 } }, // Creates sequence

                { new: true, upsert: true } // upsert is update and insert

            );

            this.appointmentId = `APPT-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number

        } catch (err) {

            return next(err);

        }

    }

    next();

});

module.exports=mongoose.model("Appointment",appointmentSchema);

 