const express = require("express");
const router = express.Router();

const employeeController = require("../controllers/employeeController");
const { signUpByAdmin } = require("../controllers/authController");

router.get("/all", employeeController.getAllEmployees);
router.post("/create", signUpByAdmin);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);
router.patch("/approve/:id", employeeController.approveEmployee);

module.exports = router;
