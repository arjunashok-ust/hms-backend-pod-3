const Node = require('../models/node.model');
const Role = require('../models/role.model');

const ERR = require('../utils/errors.utils');
const { pickDefined } = require('../utils/object.utils');
const { SUCCESS_MESSAGES } = require('../constants/messages.constants');

const getNodes = async ({ role }) => {
    if (!(await Role.exists({ role_name: role }))) throw ERR.unknownRole();

    return Node.find({ role }).sort({ order: 1 }).lean();
};

const createNode = async (input) => {
    if (await Node.exists({ name: input.name })) throw ERR.nodeExists();

    const node = await Node.create(input);

    return node.toObject();
};

const editNode = async ({ nodeName, data }) => {
    const node = await Node.findOneAndUpdate(
        { name: nodeName },
        pickDefined(data),
        { new: true, runValidators: true },
    ).lean();
    if (!node) throw ERR.nodeNotFound();

    return node;
};

const deleteNode = async ({ nodeName }) => {
    const node = await Node.findOneAndDelete({ name: nodeName });
    if (!node) throw ERR.nodeNotFound();

    return { message: SUCCESS_MESSAGES.NODE_DELETED };
};

module.exports = { getNodes, createNode, editNode, deleteNode };
