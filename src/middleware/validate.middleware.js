const { validationResult } = require('express-validator');

const validate = async (req, res, next) => {
    const errors = validationResult(req);
    console.log(errors);

    if (!errors.isEmpty()) {
        const mergedMessage = errors
            .array()
            .map(err => err.msg)
            .join(", ");

        return res.status(422).json({
            message: mergedMessage
        });
    }

    next();
}

module.exports = validate;