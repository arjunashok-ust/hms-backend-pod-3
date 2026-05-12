const Nodes = require("../models/Nodes");

exports.createNode = async (req, res) => {
    try {
        if (req.user.role != "ADMIN") {
            return res.status(400).json({
                message: "Only admin has node creation privileges"
            })
        }

        const { name, role } = req.body;
        const existingNode = await Nodes.findOne({ name: name });
        if (existingNode) {
            return res.status(400).json({ message: "Node already exists" })
        }
        const createdNode = await Nodes.create({ name, role });
        res.status(200).json({
            message: "node created successfully",
            createdNode
        })
    }
    catch (err) {
        console.error(err)
        res.status(200).json({
            message: err.message
        })
    }
}

exports.deleteNode = async (req, res) => {
    try {
        if (req.user.role != "ADMIN") {
            return res.status(400).json({
                message: "Only admin has node deletion privileges"
            })
        }
        const { name, role } = req.body;
        const existingNode = await Nodes.findOne({ name: name, role: role });
        if (!existingNode) {
            return res.status(400).json({ message: "Node doesn't exist" })
        }

        const deletedNode = await Nodes.findOneAndDelete({ name: name, role: role });
        res.status(200).json({
            message: "Node deleted", deletedNode
        })
    }
    catch (err) {
        console.error(err)
        res.status(200).json({
            message: err.message
        })
    }
}