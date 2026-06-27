const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET =process.env.REFRESH_TOKEN_SECRET;
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";


const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role },ACCESS_SECRET,{ expiresIn: ACCESS_EXPIRES }
  );

/* Long-lived token used only at /refresh. Minimal payload (just the id). */
const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });

const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

const hashToken = (token) => bcrypt.hash(token, 12);
const compareToken = (token, hash) => bcrypt.compare(token, hash);


const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/emp",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareToken,
  refreshCookieOptions,
};
