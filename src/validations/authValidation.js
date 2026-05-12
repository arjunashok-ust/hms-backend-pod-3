const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

exports.signupValidation = [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be atleast 8 characters"),
    body("role").notEmpty().withMessage("Role required"),
    body("phone").notEmpty().withMessage("Phone no required"),
    body("department").notEmpty().withMessage("Department required"),
    body("designation").notEmpty().withMessage("Designation required"),
    body("joiningDate").notEmpty().withMessage("Joining Date required"),
]

exports.loginValidation = [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be atleast 8 characters"),
]