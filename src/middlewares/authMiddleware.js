const jwt = require('jsonwebtoken');


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Please log in' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: 'Unauthorized: Role not found' });
    }

    if (!allowedRoles.includes(req.user.role.toUpperCase())) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to perform this action' 
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };