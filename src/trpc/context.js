const jwt = require('jsonwebtoken');

// Built for every request. Never throws: whether a missing / invalid token is acceptable is decided
// per procedure (publicProcedure vs protectedProcedure), not here.
//   ctx.user      decoded access token { userId, email, role } or null
//   ctx.authError 'missing' | 'invalid' | null, lets the auth middleware pick the right message
const createContext = ({ req, res }) => {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
        return { req, res, user: null, authError: 'missing' };
    }

    try {
        const user = jwt.verify(header.slice('Bearer '.length), process.env.ACCESS_TOKEN_SECRET);
        return { req, res, user, authError: null };
    } catch {
        return { req, res, user: null, authError: 'invalid' };
    }
};

module.exports = { createContext };
