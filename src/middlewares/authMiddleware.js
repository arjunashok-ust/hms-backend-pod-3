/**
 * @file authMiddleware.js
 * @description
 * This file contains Express.js middleware functions for handling authentication and role-based authorization.
 *
 * @overview
 * This module exports two primary middleware functions.
 * The `authenticateToken` middleware validates a JSON Web Token (JWT) from the 'Authorization' header.
 * If the token is valid, it decodes the payload and attaches it to the request object as `req.user`.
 * The `authorizeRoles` middleware is a higher-order function that returns a new middleware.
 * This returned middleware checks if the role of the authenticated user (`req.user.role`) is included in the list of allowed roles for a specific route.
 * It is typically one of the first middleware in a protected route's pipeline.
 *
 * Connections:
 *   API Request -> route -> AUTHENTICATETOKEN -> [permissionMiddleware | controller]
 */
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided. Please log in" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ message: "Unauthorized: Role not found" });
    }

    if (!allowedRoles.includes(req.user.role.toUpperCase())) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to perform this action",
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
