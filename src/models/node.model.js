const mongoose = require('mongoose');
const Counter = require('../models/counter.model');

const nodeSchema = new mongoose.Schema({
    nodeId: { type: String },
    name: { type: String, required: true },
    role: [{ type: String, required: true }]
});


nodeSchema.pre('save', async () => {
    if (this.IsNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: 'Node' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );

            this.nodeId = `NODE-${String(counter.seq).padStart(6, '0')}`;
        }
        catch (err) {
            console.error('node prehook error' + err);
            throw (err);
        }
    }
});

module.exports = mongoose.model('Nodes',nodeSchema);

