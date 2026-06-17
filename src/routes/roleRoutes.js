const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.post("/create", roleController.createRole);
router.get("/show", roleController.getAllRoles);
router.put("/:id", roleController.updateRole);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
