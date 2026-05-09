const mongoose=require('mongoose');

const billSchema=mongoose.Schema({
    billId:{type:String,unique:true},
    appointmentId:{type:String},
    patientId:{type:String,required:true},
    items:[{
        serviceName:{type:String,required:true},
        amount:{type:Number,required:true}
    }],
    total:{type:Number,required:true},
    status:{type:String,enum:['PENDING','PAID','PARTIAL'],default:'PENDING'},
    createdByEmployeeId:{type:String,required:true},
})
billSchema.pre('save', async function (next) {

    if (this.isNew) {

        try {

            const counter = await Counter.findOneAndUpdate(

                { name: 'bill' },

                { $inc: { seq: 1 } }, // Creates sequence

                { new: true, upsert: true } // upsert is update and insert

            );

            this.billId = `BILL-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number

        } catch (err) {

            return next(err);

        }

    }

    next();

});
 