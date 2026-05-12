const { body } = require('express-validator');

const validateDeleteUserProfile = [
    body("id").notEmpty().withMessage("id is required.")
];

module.exports = { validateDeleteUserProfile }