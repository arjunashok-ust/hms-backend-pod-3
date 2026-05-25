const express = require('express');
const router = express.Router();

const nodeController = require('../controller/node.controller');
const validateNode = require('../validation/node.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');

router.get('/getNodes',validate,nodeController.getNodes);

module.exports = router;