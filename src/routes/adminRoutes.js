const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const rolevalidate = require("../middleware/roleMiddleware");

const { deleteUserProfile, getAllUsers, dashboardData, getPendingUsers,
    approveUser,
    rejectUser,
    getApprovalStats } = require("../controllers/adminController");

router.get('/getDashBoardData', auth, rolevalidate("ADMIN"), validate, dashboardData);
router.get('/getAllUsers', auth, rolevalidate("ADMIN"), validate, getAllUsers);
router.delete('/deleteUser', auth, rolevalidate("ADMIN"), validate, deleteUserProfile);
router.get("/pendingUsers",auth,rolevalidate("ADMIN"),getPendingUsers);
router.put("/approveUser/:employeeCode",auth,rolevalidate("ADMIN"),approveUser);
router.put("/rejectUser/:employeeCode",auth,rolevalidate("ADMIN"),rejectUser);
router.get("/approvalStats",auth,rolevalidate("ADMIN"),getApprovalStats);
module.exports = router;
