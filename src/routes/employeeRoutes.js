const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const roleValidation=require("../middlewares/roleMiddleware");

const {
  signup,
  login,
  currentUser,
  resetPassword,
  formSignUp,
} = require("../controllers/employeeController");

const signUpValidation = [

  body("name")
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Valid email required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength(8)
    .withMessage("Atleast 8 digit password required"), 

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required"),

  body("role")
    .notEmpty()
    .withMessage("Role is required"),

  body("department")
    .notEmpty()
    .withMessage("Department is required"),

  body("designation")
    .notEmpty()
    .withMessage("Designation is required"),

];

router.post("/signup",auth,roleValidation('admin'),signUpValidation, validate, signup);
router.post("/formSignUp",signUpValidation, validate, formSignUp);
router.post("/login", login);
router.get("/currentUser", auth, currentUser);
router.put("/reset-password",auth,resetPassword);

module.exports = router;