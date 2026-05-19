const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    role_id: {type: Number,required: true},
    role_name: {type: String,required: true},
});

module.exports = mongoose.model('roles',roleSchema);