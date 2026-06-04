const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const employeeController = require("../controllers/employeeController");
const { signUpByAdmin } = require("../controllers/authController");

router.get("/all", authenticateToken, employeeController.getAllEmployees);
router.post("/create", authenticateToken, signUpByAdmin);
router.put("/:id", authenticateToken, employeeController.updateEmployee);
router.delete("/:id", authenticateToken, employeeController.deleteEmployee);
router.patch(
  "/approve/:id",
  authenticateToken,
  employeeController.approveEmployee,
);

module.exports = router;
