const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");
const PERMISSIONS = require("../constants/permissions");

const {
  signup,
  login,
  forgotPassword,
  currentUser,
  resetPassword,
  refreshToken,
  logout,
  formSignUp,
  dashboardStats,
  getEmployees,
  deleteEmployee,
  updateEmployee,
  updateEmployeeById,
  getPendingApprovals,
  approveEmployee,
  rejectEmployee,
  approvalStats
} = require("../controllers/employeeController");

const adminSignUpValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("role").notEmpty().withMessage("Role is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("designation").notEmpty().withMessage("Designation is required"),
];

const signUpValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required").isLength(8).withMessage("Atleast 8 digit password required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("role").notEmpty().withMessage("Role is required"),
  body("department").notEmpty().withMessage("Department is required"),
  body("designation").notEmpty().withMessage("Designation is required"),
];

const forgotPasswordValidation = [
  body("email").notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required")
];

/* PUBLIC */
router.post("/formSignUp", signUpValidation, validate, formSignUp);
router.post("/login", login);
router.post("/forgot-password",forgotPasswordValidation,validate,forgotPassword);
/* Refresh is public: the access token is expired by definition; the httpOnly
   refresh cookie is the credential. */
router.post("/refresh", refreshToken);

/* AUTH ONLY */
router.post("/logout", auth, logout);

/* AUTH ONLY (no specific permission needed) */
router.get("/currentUser", auth, currentUser);
router.put("/reset-password", auth, resetPassword);

/* SELF-SERVICE PROFILE UPDATE */
router.put("/updateProfile/:employeeId", auth, checkPermission(PERMISSIONS.EDIT_PROFILE), updateEmployeeById);

/* PERMISSION GUARDED */
router.post("/signup",auth,checkPermission(PERMISSIONS.CREATE_EMPLOYEE),adminSignUpValidation,validate,signup,);
router.get("/dashboard-stats", auth, checkPermission(PERMISSIONS.VIEW_DASHBOARD), dashboardStats);
router.get("/employees", auth, checkPermission(PERMISSIONS.VIEW_EMPLOYEE), getEmployees);
router.delete("/deleteEmployee/:employeeId",auth,checkPermission(PERMISSIONS.DELETE_EMPLOYEE),deleteEmployee,);
router.put("/updateEmployee/:employeeId",auth,checkPermission(PERMISSIONS.EDIT_EMPLOYEE),updateEmployee,);

/* EMPLOYEE APPROVAL WORKFLOW */
router.get("/pendingApprovals", auth, checkPermission(PERMISSIONS.VIEW_APPROVAL), getPendingApprovals);
router.put("/approveEmployee/:employeeId", auth, checkPermission(PERMISSIONS.APPROVE_EMPLOYEE), approveEmployee);
router.delete("/rejectEmployee/:employeeId", auth, checkPermission(PERMISSIONS.APPROVE_EMPLOYEE), rejectEmployee);
router.get("/approvalStats", auth, checkPermission(PERMISSIONS.VIEW_APPROVAL), approvalStats);

module.exports = router;