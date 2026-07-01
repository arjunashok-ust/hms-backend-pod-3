const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    group: {
      type: String,
      default: "Custom",
    },
  },
  { timestamps: true },
);

permissionSchema.pre("save", function () {
  if (this.isModified("name")) {
    this.group = this.name.split("_")[0];
  }
});

module.exports = mongoose.model("Permissions", permissionSchema);
