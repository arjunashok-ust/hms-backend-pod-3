const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
    order: {
        type: String,
        required: true
    },
    name: {
        type: String,
        trim: true,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Node",nodeSchema);