const express = require("express");
const router = express.Router();
const asyncHandler = require("../middlewares/asyncHandler");
const roleController = require("../controllers/roleController");

router.post("/create", asyncHandler(roleController.createRole));
router.get("/show", asyncHandler(roleController.getAllRoles));
router.put("/:id", asyncHandler(roleController.updateRole));
router.delete("/:id", asyncHandler(roleController.deleteRole));

module.exports = router;
