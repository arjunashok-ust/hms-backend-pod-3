const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const authenticateToken = require("../middlewares/authMiddleware");
const {
    signupValidation,
    loginValidation } = require("../validations/authValidation")

const {
    deleteProfile,
    updateProfile
} = require("../controllers/profileController");

router.delete("/deleteProfile", authenticateToken, deleteProfile);
router.patch("/updateProfile", authenticateToken, updateProfile);

module.exports = router;