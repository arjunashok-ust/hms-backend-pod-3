const { body, query } = require("express-validator");

exports.createNodeValidation = [

    body("name").trim().notEmpty().withMessage("Name is required"),
    body("path").trim().notEmpty().withMessage("Path is required"),
    body("role").isArray({ min: 1 }).withMessage("At least one role is required"),
    body("role.*").isIn([
            "ADMIN",
            "DOCTOR",
            "RECEPTIONIST",
            "CASHIER",
            "NURSE",
            "LAB_TECH",
            "PHARMACIST"
        ]).withMessage("Invalid role"),

    body("order").isInt({ min: 1 }).withMessage("Order must be a positive number"),
    body("icon").trim().notEmpty().withMessage("Icon is required")
];