const express = require('express');
const router = express.Router();

const UiController = require('../controller/ui.controller');

router.get('/getRoles',UiController.getRoles);
router.get('/getDepartments',UiController.getDepartments);
router.get('/getSpecializations',UiController.getSpecializations);

module.exports = router;