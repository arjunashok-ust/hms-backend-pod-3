const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const authenticateToken = require("../middlewares/authMiddleware");

const {
    deleteNode,
    createNode
} = require("../controllers/nodeController");

router.delete("/deleteNode", authenticateToken, deleteNode);
router.post("/createNode", authenticateToken, createNode);

module.exports = router;