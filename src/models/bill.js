const mongoose = require('mongoose');
const billSchema = new mongoose.Schema({
    patientId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Patient',
        required : true
    },
    items :[{serviceName : String, amount : Number}],
    total : { type : Number, required : true},
    status : { type : String, enum : ["PENDING", "PAID", "PARTIAL"]},
    createdByEmployeeId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Employee',
        required : true
    },

});
module.exports = mongoose.model('Bill',billSchema);



// id
// patientId
// appointmentId (optional)
// items[] (serviceName, amount)
// total
// status → PENDING | PAID | PARTIAL
// createdByEmployeeId → Employee (cashier/admin)