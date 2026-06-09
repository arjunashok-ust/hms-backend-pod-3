const express = require("express");
const router = express.Router();

const auth = require("../middlewares/authMiddleware");

const {getAllPatients} = require("../controllers/patientController");

router.get(
  "/getAllPatients",
  auth,
  getAllPatients
);

module.exports = router;