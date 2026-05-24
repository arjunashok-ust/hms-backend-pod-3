const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({path: "../.env"});

const Employee = require("./models/Employee");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log("MongoDB Connected");

    // CHECK EXISTING ADMIN
    const existingAdmin = await User.findOne({role: "admin"});
    if (existingAdmin) {
        console.log("Admin already exists");
        process.exit();
    }

    // HASH PASSWORD

    const password_hash = await bcrypt.hash("Admin@123",12);        

    // CREATE EMPLOYEE PROFILE

    const employee = await Employee.create({

        email: "admin@hms.com",

        name: "Super Admin",

        phone: "9999999999",

        department: "Administration",

        designation: "System Admin",

        joiningDate: new Date(),

        status: true

    });

    // CREATE USER ACCOUNT

    const user = await User.create({

        email: "admin@hms.com",

        password_hash,

        role: "admin",

        employeeId: employee.employeeId,
        
        isFirstLogin: false,

        status: true

    });

    console.log("Admin Seeded Successfully");

    console.log({
        email: user.email,
        password: "Admin@123"
    });

    process.exit();

})
.catch((err) => {

    console.log(err);

});