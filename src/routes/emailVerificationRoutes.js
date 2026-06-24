const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const asyncHandler = require("../middlewares/asyncHandler");

const { verifyEmail } = require("../controllers/verifyEmailController");
router.get("/verify-email", asyncHandler(verifyEmail));

module.exports = router;
