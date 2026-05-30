const mongoose = require("mongoose");

const specializationSchema = new mongoose.Schema({
    specializationId: {
        type: Number,
        required: true
    },
    specializationName: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("specialization",specializationSchema);