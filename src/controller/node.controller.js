const Node = require('../models/node.model');
const Role = require('../models/role.model');

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