const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");

const {
  signup,
  login,
  currentUser,
} = require("../controllers/employeeController");

const signUpValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("name").notEmpty().withMessage("Name is required")
]

router.post("/signup", signUpValidation, validate, signup);
router.post("/login", login);
router.get("/currentUser", auth, currentUser);

module.exports = router;