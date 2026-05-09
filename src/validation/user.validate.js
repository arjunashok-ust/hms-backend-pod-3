const { body } = require('express-validator');

const validateGetUserProfile = [
    body('email').isEmail().withMessage('invalid email format'),
];

module.exports = { validateGetUserProfile };