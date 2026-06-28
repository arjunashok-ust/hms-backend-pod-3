const Node = require("../models/Node");
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// @desc    Create a new node
// @route   POST /api/node
exports.createNode = asyncHandler(async (req, res) => {
  const { node_id, name, path, role, icon } = req.body;

  const node = await new Node({ node_id, name, path, role, icon }).save();

  return res
    .status(201)
    .json(new ApiResponse(201, "Node created successfully", node));
});

// @desc    Get all nodes
// @route   GET /api/node
exports.getAllNodes = asyncHandler(async (req, res) => {
  const nodes = await Node.find().sort({ node_id: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, "Nodes fetched successfully", nodes));
});

// @desc    Get a single node by id
// @route   GET /api/node/:id
exports.getNodeById = asyncHandler(async (req, res) => {
  const node = await Node.findById(req.params.id);

  if (!node) {
    throw new ApiError(404, "Node not found", "NODE_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Node fetched successfully", node));
});

// @desc    Update a node by id
// @route   PUT /api/node/:id
exports.updateNode = asyncHandler(async (req, res) => {
  const { node_id, name, path, role, icon } = req.body;

  const updatedNode = await Node.findByIdAndUpdate(
    req.params.id,
    { node_id, name, path, role, icon },
    { new: true, runValidators: true }
  );

  if (!updatedNode) {
    throw new ApiError(404, "Node not found", "NODE_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Node updated successfully", updatedNode));
});

// @desc    Delete a node by id
// @route   DELETE /api/node/:id
exports.deleteNode = asyncHandler(async (req, res) => {
  const deletedNode = await Node.findByIdAndDelete(req.params.id);

  if (!deletedNode) {
    throw new ApiError(404, "Node not found", "NODE_NOT_FOUND");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Node deleted successfully", deletedNode));
});
