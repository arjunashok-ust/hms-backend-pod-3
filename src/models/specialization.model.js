const mongoose = require('mongoose');

const specializationSchema = new mongoose.Schema({
    specialization_id: {type: Number,required: true},
    specialization_name: {type: String,required: true},
});

module.exports = mongoose.model('specializations',specializationSchema);