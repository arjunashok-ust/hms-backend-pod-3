const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        unique: true
    },
    billId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : ' Bill',
        required : true
    },
    amount : { type : Number,  ref : 'Bill', required : true},
    method : { type : String, enum : ["CASH", "CARD", "UPI"], required : true},
    paidAt : { type : Date, default : Date.now},
    receivedByEmployeeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Employee',
        required : true
    }
});

paymentSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'employee' },
                { $inc: { seq: 1 } }, // Creates sequence
                { new: true, upsert: true } // upsert is update and insert
            );
            this.employeeId = `EMP-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number
        } catch (err) {
            return next(err);
        }
    }
    next();
});
module.exports = mongoose.model('Payment', paymentSchema);

// id
// billId
// amount
// method → CASH | CARD | UPI
// paidAt
// receivedByEmployeeId → Employee (cashier)