const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    roleId: {
        type: Number,
        required: true
    },
    roleName: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("role",roleSchema);