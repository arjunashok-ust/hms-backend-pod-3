const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

const Employee = require("./models/Employee");
const User = require("./models/User");

  try {
    mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    const password_hash = bcrypt.hash(
      "Admin@123",
      12
    );

    create({
      email: "admin@hms.com",
      name: "Super Admin",
      phone: "9999999999",
      department: "Administration",
      designation: "System Admin",
      joiningDate: new Date(),
      status: true,
    });

    User.create({
      email: "admin@hms.com",
      password_hash,
      role: "admin",
      employeeId: employee.employeeId,
      isFirstLogin: false,
      status: true,
    });

    console.log("Admin Seeded Successfully");


    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }