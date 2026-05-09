const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true   // one counter per model
    },
    seq: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model("Counter", counterSchema);