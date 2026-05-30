const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const { getNodes } = require("../controllers/node.controller");
const { modelName } = require("../models/Node");

router.get("/getnodes", validate, getNodes);

module.exports = router;