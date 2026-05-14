const express = require('express');
const router = express.Router();

const nodeController = require('../controller/node.controller');
const validateNode = require('../validation/node.validate');
const validate = require('../middleware/validate.middleware');

router.post('/addNode',validateNode.validateCreateNode,validate,nodeController.addNode);
router.post('/deleteNode',validateNode.validateDeleteNode,validate,nodeController.deleteNode);
router.get("/",async (req,res) => {
    return res.status(200).json({message: "server running.."});
});

module.exports = router;