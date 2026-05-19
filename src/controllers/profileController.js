const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Users = require("../models/Users");
const Employees = require("../models/Employees")


exports.deleteProfile = async (req, res) => {
    try {
        const user = await Users.findOne({ employeeID: req.user.employeeID }).select("-__v -passwordHash")
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const profile = await Employees.findOne({ email: user.email }).select("-__v");
        res.status(200).json({
            user: profile
        })
    }
    catch {
        console.error("Error fetching logged in user:", err);
        res.status(500).json({ message: err.message });
    }
};