const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate =require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const rolevalidate = require("../middleware/roleMiddleware");

const { createNode, getAllNodes, getNodesByRole} = require("../controllers/nodeController");

const { createNodeValidation } = require("../validations/nodeValidations");

router.post("/createNode", auth, rolevalidate("ADMIN"),createNodeValidation, validate, createNode);
router.get("/getAllNodes", auth, rolevalidate("ADMIN"), validate, getAllNodes);
router.get("/getNodesByRole", auth, validate, getNodesByRole);

module.exports = router;
