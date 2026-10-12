const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    role_id: {type: Number,required: true},
    role_name: {type: String,required: true},
    role_permissions: [ {type: String}],
});

module.exports = mongoose.model('roles',roleSchema);