const express = require("express");
const router = express.Router();
const { getDepartments, getRoles, getSpecializations } = require("../controllers/ui.controller");

router.get("/getdepartment", getDepartments);
router.get("/getroles", getRoles);
router.get("/getspecialization", getSpecializations);

module.exports = router;