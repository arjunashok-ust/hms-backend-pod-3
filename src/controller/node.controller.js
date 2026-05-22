const Node = require('../models/node.model');
const Role = require('../models/role.model');

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
            role: node.role
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during delete node' });
    }
}

// Get Node
const getNodes = async (req, res) => {
    try {

        const role = req.query.role;
        console.log(role);

        const isRole = await Role.findOne({ role_name: role });
        if (!isRole) {
            return res.status(400).json({ message: "Unknown Role" });
        }

        const node = await Node.find({ role: role }).sort({ order: 1 });

        return res.status(200).json(node);
    } catch (err) {
        return res.status(500).json({ message: 'Server Error During Get Node!' });
    }
}

module.exports = { getNodes }