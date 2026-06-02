const express = require("express");
const router = express.Router();

const employeeController = require('../controller/employeeController');

// ✅ GET all employees (except admin)
router.get('/', employeeController.getAllEmployees);

module.exports = router;