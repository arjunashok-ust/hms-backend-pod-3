const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { getAllUsers, getAllEmployees, getDashboardData, adminDelete, adminSignup, 
    acceptApproval, rejectApproval } = require("../controllers/admin.controller");
const { deleteProfileByAdmin } = require("../validations/admin.validation");
const { validateSignUp} = require("../validations/auth.validation")

router.delete("/admindelete", authMiddleware, deleteProfileByAdmin, validate, adminDelete);
router.get("/getallusers", validate, getAllUsers);
router.get("/getallemployees", validate, getAllEmployees);
router.get("/getdashboarddata", validate, getDashboardData);
router.post("/adminsignup", validateSignUp,validate, adminSignup);
router.post("/acceptapproval", validate, acceptApproval);
router.post("/rejectapproval", validate, rejectApproval);

module.exports = router;