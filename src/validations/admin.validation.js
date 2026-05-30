const { body } = require('express-validator');

const deleteProfileByAdmin = [
    body("email").notEmpty().isEmail().withMessage("Email is required")
];

module.exports = { deleteProfileByAdmin }