const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
    departmentId: {
        type: Number,
        required: true
    },
    departmentName: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('department',departmentSchema);