const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const { verifyEmail } = require("../controllers/verifyEmailController");
router.get("/verify-email", verifyEmail);

module.exports = router;
