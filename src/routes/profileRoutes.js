const express = require("express");
const router = express.Router();
const validate = require("../middlewares/validate");
const authenticateToken = require("../middlewares/authMiddleware");

const {
    getMe
} = require("../controllers/profileController");

router.get("/getMe", authenticateToken, getMe);

module.exports = router;