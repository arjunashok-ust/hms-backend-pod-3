const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { requiredString, messageOutput } = require('./common.schema');
const { nodeSchema } = require('./entities.schema');

const nodeFields = {
    order: z.number({ error: V.NODE_ORDER_INVALID }),
    name: requiredString(V.NODE_NAME_REQUIRED),
    path: requiredString(V.NODE_PATH_REQUIRED),
    role: z.array(requiredString(V.ROLE_REQUIRED)).min(1, V.NODE_ROLE_REQUIRED),
    icon: requiredString(V.NODE_ICON_REQUIRED),
};

// Inputs

const getNodesInput = z.object({ role: requiredString(V.ROLE_REQUIRED) });

const createNodeInput = z.object(nodeFields);

const editNodeInput = z.object({
    nodeName: requiredString(V.NODE_NAME_REQUIRED),
    data: z.object(nodeFields).partial(),
});

const deleteNodeInput = z.object({ nodeName: requiredString(V.NODE_NAME_REQUIRED) });

module.exports = {
    getNodesInput,
    createNodeInput,
    editNodeInput,
    deleteNodeInput,
    nodeOutput: nodeSchema,
    nodesOutput: z.array(nodeSchema),
    messageOutput,
};
