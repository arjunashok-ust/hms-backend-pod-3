const Node = require('../models/node.model');
const Role = require('../models/role.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');


// Get Node
const getNodes = asyncHandler(async (req, res) => {
    const role = req.query.role;

    const isRole = await Role.findOne({ role_name: role });
    if (!isRole) {
        throw ERR.unknownRole();
    }

    const node = await Node.find({ role: role }).sort({ order: 1 });

    return res.status(200).json(node);
});

// Create Node
const createNode = asyncHandler(async (req, res) => {
    const data = req.body;
    const node = await Node.create(data);
    return res.status(201).json(node);
})

// Edit Node
const editNode = asyncHandler(async (req, res) => {
    const nodeName = req.body.nodeName;
    const data = req.body.data;

    const updatedNode = await Node.findOneAndUpdate({ name: nodeName }, data, { new: true });
    if (!updatedNode) {
        throw ERR.nodeNotFound();
    }

    return res.status(200).json(updatedNode);
})

// Delete Node
const deleteNode = asyncHandler(async (req, res) => {
    const nodeName = req.body.nodeName;

    const deletedNode = await Node.findOneAndDelete({ name: nodeName });
    if (!deletedNode) {
        throw ERR.nodeNotFound();
    }

    return res.status(200).json({ message: "Node deleted sucessfully" });
});

module.exports = { getNodes, createNode, editNode, deleteNode }