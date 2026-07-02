const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const departmentSchema = new mongoose.Schema({
  departmentId: { type: String },
  departmentName: { type: String, required: true },
});

departmentSchema.pre("save", async function () {
  if (this.isNew) {
    this.departmentId = await generateId("department", "DEP");
  }
});

module.exports = mongoose.model("Departments", departmentSchema);
