const nodeModel = require("../models/Node");
const roleModel = require("../models/Role");

exports.getNodes = async (req, res) => {
    try {
        const role = req.query.role;
        const isRole = await roleModel.findOne({ roleName: role });
        if (!isRole) {
            return res.status(400).json({ message: "Unknown Role" });
        }
        const node = await nodeModel.find({ role: role }).sort({ order: 1 });
        return res.status(200).json(node);
    } catch (err) {
        return res.status(500).json({ message: 'Server Error During Get Node!' });
    }
}