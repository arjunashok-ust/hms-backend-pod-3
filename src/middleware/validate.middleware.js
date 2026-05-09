const { validationResult } = require('express-validator');

const validate = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        // 422 Unprocessable entity
        return res.status(422).json({ message: errors.array() });
    next();
}

module.exports = validate;