const Node = require('../models/Node');

// @desc    Create a new node
// @route   POST /api/nodes
exports.createNode = async (req, res) => {
    try {
        const { order, name, path, role, icon } = req.body;

        const node = new Node({ order, name, path, role, icon });
        const savedNode = await node.save();

        return res.status(201).json({
            success: true,
            message: 'Node created successfully',
            data: savedNode,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create node',
            error: error.message,
        });
    }
};

// @desc    Get all nodes
// @route   GET /api/nodes
exports.getAllNodes = async (req, res) => {
    try {
        const nodes = await Node.find().sort({ order: 1 });

        return res.status(200).json({
            success: true,
            count: nodes.length,
            data: nodes,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch nodes',
            error: error.message,
        });
    }
};

// @desc    Get a single node by id
// @route   GET /api/nodes/:id
exports.getNodeById = async (req, res) => {
    try {
        const node = await Node.findById(req.params.id);

        if (!node) {
            return res.status(404).json({
                success: false,
                message: 'Node not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: node,
        });
    } catch (error) {
        // Handles malformed ObjectId as well
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch node',
            error: error.message,
        });
    }
};

// @desc    Update a node by id
// @route   PUT /api/nodes/:id
exports.updateNode = async (req, res) => {
    try {
        const { order, name, path, role, icon } = req.body;

        const updatedNode = await Node.findByIdAndUpdate(
            req.params.id,
            { order, name, path, role, icon },
            { new: true, runValidators: true }
        );

        if (!updatedNode) {
            return res.status(404).json({
                success: false,
                message: 'Node not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Node updated successfully',
            data: updatedNode,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update node',
            error: error.message,
        });
    }
};

// @desc    Delete a node by id
// @route   DELETE /api/nodes/:id
exports.deleteNode = async (req, res) => {
    try {
        const deletedNode = await Node.findByIdAndDelete(req.params.id);

        if (!deletedNode) {
            return res.status(404).json({
                success: false,
                message: 'Node not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Node deleted successfully',
            data: deletedNode,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete node',
            error: error.message,
        });
    }
};
