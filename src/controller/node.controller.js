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

module.exports = { getNodes }