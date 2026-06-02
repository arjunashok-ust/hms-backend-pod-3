const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    path:{
        type:String,
        required: true
    },
    role:[{
        type: String,
        required: true
    }],
    order: { 
        type: Number, 
        required: true
    },
    icon:{
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Node", nodeSchema);