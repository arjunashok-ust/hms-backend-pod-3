const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: [{ type: String }]
})

module.exports = mongoose.model("Nodes", nodeSchema);