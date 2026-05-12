const mongoose = require('mongoose');
 
const nodeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: [{ type: String, required: true }]
});
 
module.exports = mongoose. Model("Node",nodeSchema);