const { body,query } = require('express-validator');

const validateGetUserProfile = [
    query('email').isEmail().withMessage('invalid email format'),
];

module.exports = { validateGetUserProfile };