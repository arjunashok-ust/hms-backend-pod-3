const { body,query } = require('express-validator');

const validateGetNode = [
    query("role").notEmpty().withMessage("Role Is Required"),
]

module.exports = { validateGetNode }