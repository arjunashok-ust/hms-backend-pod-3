const jwt = require('jsonwebtoken');
const ERR = require('../utils/errors.utils');

const auth = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw ERR.tokenNotFound();
    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error(err);
        throw ERR.tokenInvalidOrExpired();
    }
}

module.exports = auth;