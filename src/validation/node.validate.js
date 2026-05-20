const { body,query } = require('express-validator');

const validateCreateNode = [
    body("name").notEmpty().withMessage("name is required."),
    body("roles").notEmpty().withMessage("roles is required.")
];

const validateDeleteNode = [
    body("name").notEmpty().withMessage("name is required."),
];

const validateGetNode = [
    query("role").notEmpty().withMessage("Role Is Required"),
]

module.exports = { validateCreateNode, validateDeleteNode,validateGetNode }