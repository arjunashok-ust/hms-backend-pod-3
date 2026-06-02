const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate =require("../middleware/validate");
const auth = require("../middleware/authMiddileware");
const rolevalidate = require("../middleware/roleMiddleware");

const { createNode, getAllNodes, getNodesByRole} = require("../controllers/nodeController");

const createNodeValidation = [

    body("name").trim().notEmpty().withMessage("Name is required"),
    body("path").trim().notEmpty().withMessage("Path is required"),
    body("role").isArray({ min: 1 }).withMessage("At least one role is required"),
    body("role.*").isIn([
            "Admin",
            "Doctor",
            "Receptionist",
            "Cashier",
            "Nurse",
            "Lab_tech",
            "Pharmicist"
        ]).withMessage("Invalid role"),

    body("order").isInt({ min: 1 }).withMessage("Order must be a positive number"),
    body("icon").trim().notEmpty().withMessage("Icon is required")
];

router.post("/createNode", auth, rolevalidate("ADMIN"),createNodeValidation, validate, createNode);
router.get("/getAllNodes", auth, rolevalidate("ADMIN"), validate, getAllNodes);
router.get("/getNodesByRole", auth, validate, getNodesByRole);

module.exports = router;
 