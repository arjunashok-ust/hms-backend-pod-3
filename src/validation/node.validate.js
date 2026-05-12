const { body } = require('express-validator');

const validateCreateNode = [
    body("name").notEmpty().withMessage("name is required."),
    body("roles").notEmpty().withMessage("roles is required.")
];

const validateDeleteNode = [
    body("name").notEmpty().withMessage("name is required."),
];

module.exports = { validateCreateNode, validateDeleteNode }