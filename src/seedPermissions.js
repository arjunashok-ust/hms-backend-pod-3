require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("node:fs");
const Permission = require("./models/Permissions"); // Make sure this path points to your Permission model

// This function automatically categorizes the permissions into UI groups based on their first word
const getGroupFromPrefix = (permName) => {
  const prefix = permName.split("_")[0];
  const groupMap = {
    VIEW: "View",
    CREATE: "Create",
    UPDATE: "Edit",
    DELETE: "Delete",
    APPROVE: "Workflow",
    REJECT: "Workflow",
    COMPLETE: "Workflow",
    ADMIN: "Access & Admin",
    PATIENT: "Access & Admin",
    DOCTOR: "Access & Admin",
    RECEPTIONIST: "Access & Admin",
    MANAGE: "Access & Admin", // Catches MANAGE_PERMISSIONS
  };
  return groupMap[prefix] || "Custom";
};

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB using your .env variable
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 2. Read the JSON file you uploaded
    // Ensure "HMS-BACKEND.roles.json" is in the same folder as this script
    const rawData = fs.readFileSync("./src/HMS-BACKEND.roles.json", "utf-8");
    const roles = JSON.parse(rawData);

    // 3. Extract all unique permissions using a Set to automatically remove duplicates
    const uniquePermissions = new Set();
    roles.forEach((role) => {
      if (role.rolePermissions && Array.isArray(role.rolePermissions)) {
        role.rolePermissions.forEach((perm) => uniquePermissions.add(perm));
      }
    });

    console.log(
      `Found ${uniquePermissions.size} unique permissions in the JSON file.`,
    );

    // 4. Format them to match your Mongoose Schema
    const permissionsToInsert = Array.from(uniquePermissions).map((perm) => ({
      name: perm,
      group: getGroupFromPrefix(perm),
    }));

    // 5. Clear any existing permissions in the collection and insert the new ones
    console.log("Writing to the database...");
    await Permission.deleteMany({});
    await Permission.insertMany(permissionsToInsert);

    console.log(
      "✅ Migration Complete! All permissions added to the database successfully.",
    );
    process.exit(0); // Exit the script cleanly
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1); // Exit with an error code
  }
};

// Run the function
seedDatabase();
