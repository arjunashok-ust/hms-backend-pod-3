const express = require('express');
const router = express.Router();

const nodeController = require('../controller/node.controller');
const validateNode = require('../validation/node.validate');
const validate = require('../middleware/validate.middleware');
const auth = require('../middleware/auth.middleware');
const permission = require('../middleware/permission.middleware');

router.get('/getNodes', auth, permission('view:profile'), nodeController.getNodes);
router.post('/createNode', auth, permission('create:node'), nodeController.createNode);
router.post('/editNode', auth, permission('edit:node'), nodeController.editNode);
router.post('/deleteNode', auth, permission('delete:node'), nodeController.deleteNode);

module.exports = router;