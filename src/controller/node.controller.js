const Node = require('../models/node.model');
const Role = require('../models/role.model');

// Create Node
const addNode = async (req, res) => {
    try {
        const {
            name,
            role
        } = req.body;

        const existingNode = await Node.findOne({ name: name });
        if (existingNode) {
            return res.status(409).json({ message: 'node already defined.' });
        }

        const node = await Node.create({
            name,
            role
        });

        return res.status(200).json({
            message: `node created successfully, ${node.name}`,
            roles: role
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during add node' });
    }
}


// Delete Node
const deleteNode = async (req, res) => {
    try {
        const name = req.body.name;

        const node = await Node.findOneAndDelete({ name });

        if (!node) {
            return res.status(404).json({ message: 'node not found' });
        }

        return res.status(200).json({
            message: `node deleted successfully ${node.name}`,
            roles: node.roles
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during delete node' });
    }
}

// Get Node
const getNode = async (req, res) => {
    try {
        const {
            role
        } = req.query.role;

        const isRole = await Role.findOne({ role_name: role });
        if (!isRole) {
            return res.status(400).json({ message: "Unknown Role" });
        }

        // return node
    } catch (err) {
        return res.status(500).json({message: 'Server Error During Get Node!'});
    }
}

module.exports = { addNode, deleteNode }