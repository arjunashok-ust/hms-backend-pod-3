const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");


const{
    signup,
    login,
    getEmployeeById,
    updateEmployeeById,
}=require("../controllers/EmployeeController");

const signUpValidation=[
    body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
]

router.post("/signup",signUpValidation,validate,signup);
router.post("/login",login);
router.get("/getEmployeeById/:employeeId",getEmployeeById);
router.post("/updateEmployeeById",updateEmployeeById);



module.exports=router;