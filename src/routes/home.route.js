const express = require('express');
const router = express.Router();

const sendTestMail = require('../test');

router.get("/", sendTestMail);

module.exports = router;