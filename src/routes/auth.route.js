const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth.middleware");
const { validateSignUp, loginValidation } = require("./route.validation");
const { signUp, login, profile, adminDelete, updateEmployee } = require("../controllers/auth.controller");

router.post("/signup", validateSignUp, validate, signUp);
router.post("/login", loginValidation, validate, login);
router.get("/profile", authMiddleware, validate, profile);
router.delete("/admindelete",authMiddleware, validate, adminDelete);
router.put("/updateEmployee/:id", authMiddleware,validate, updateEmployee);

module.exports = router;