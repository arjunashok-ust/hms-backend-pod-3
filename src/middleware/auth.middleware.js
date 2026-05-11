const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'token not found!' });
    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'invalid or expired token' })
    }
}

module.exports = auth;