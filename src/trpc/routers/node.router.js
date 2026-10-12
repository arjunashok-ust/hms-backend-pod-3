const { router, permissionProcedure } = require('../trpc');
const nodeService = require('../../services/node.service');
const { PERMISSIONS: P } = require('../../constants/permissions.constants');
const schema = require('../schemas/node.schema');

// navigation nodes (the menu each role sees)
const nodeRouter = router({
    getNodes: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.getNodesInput)
        .output(schema.nodesOutput)
        .query(({ input }) => nodeService.getNodes(input)),

    createNode: permissionProcedure(P.CREATE_NODE)
        .input(schema.createNodeInput)
        .output(schema.nodeOutput)
        .mutation(({ input }) => nodeService.createNode(input)),

    editNode: permissionProcedure(P.EDIT_NODE)
        .input(schema.editNodeInput)
        .output(schema.nodeOutput)
        .mutation(({ input }) => nodeService.editNode(input)),

    deleteNode: permissionProcedure(P.DELETE_NODE)
        .input(schema.deleteNodeInput)
        .output(schema.messageOutput)
        .mutation(({ input }) => nodeService.deleteNode(input)),
});

module.exports = { nodeRouter };
