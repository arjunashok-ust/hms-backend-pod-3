const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    department_id : {type: String,unique: true},
    department_name : {type: String,unique: true}
});

module.exports = mongoose.model('departments',departmentSchema);