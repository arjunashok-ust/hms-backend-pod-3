const mongoose = require('mongoose');
const Counter = require('../models/Counter');

const nodeSchema = new mongoose.Schema({
    node_id: { type: Number, required: true},
    name: { type: String, required: true },
    path: { type: String, required: true},
    role: [{ type: String, required: true }],
    icon: { type: String, required: true},
});


module.exports = mongoose.model('nodes',nodeSchema);

