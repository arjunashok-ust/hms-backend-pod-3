const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Users = require("../models/Users");
const Employees = require("../models/Employees")


exports.deleteProfile = async (req, res) => {
    try {
        const { email } = req.body;
        const userRole = req.user.role

        if (userRole == "ADMIN") {
            await Users.findOneAndDelete({ email: email })
            console.log("User profile deleted");
            await Employees.findOneAndDelete({ email: email });
            console.log("Doctor profile deleted");
        }
        else {
            console.log("Only admin has deletion privilege")
            return res.status(400).json({ message: "Only admin has deletion privilege" })
        }
    } catch (err) {
        console.error("delete error", err);
        return res.status(500).json({
            messsage: err.message
        })
    }
    res.status(200).json({
        messsage: "Account deleted successfully"
    })
}

const buildEmployeeUpdate = (body) => {
    const allowedFields = [
        "name",
        "email",
        "phone",
        "status",
        "department",
        "designation",
        "joiningDate",
        "medicalRegistrationNo",
        "specialization",
        "qualification",
        "consultationFee",
        "availabilitySlots"
    ];

    return allowedFields.reduce((acc, field) => {
        if (body[field] !== undefined) {
            acc[field] = body[field];
        }
        return acc;
    }, {});
};

const buildUserUpdate = async (body) => {
    const userUpdate = {};

    if (body.email !== undefined) {
        userUpdate.email = body.email.toLowerCase().trim();
    }

    if (body.status !== undefined) {
        userUpdate.status = body.status;
    }

    if (body.role !== undefined) {
        userUpdate.role = body.role;
    }

    if (body.password !== undefined) {
        userUpdate.passwordHash = await bcrypt.hash(body.password, 10);
    }

    return userUpdate;
};

exports.updateProfile = async (req, res) => {
    try {
        const { employeeCode } = req.body;

        if (!employeeCode) {
            return res.status(400).json({
                message: "employeeCode is required"
            });
        }

        const [user, employee] = await Promise.all([
            Users.findOne({ employeeID: employeeCode }),
            Employees.findOne({ employeeCode })
        ]);

        if (!user || !employee) {
            return res.status(404).json({
                message: user ? "Employee not found" : "User not found"
            });
        }

        const employeeUpdate = buildEmployeeUpdate(req.body);
        const userUpdate = await buildUserUpdate(req.body);

        const [updatedUser, updatedEmployee] = await Promise.all([
            Users.findByIdAndUpdate(
                user._id,
                userUpdate,
                { returnDocument: after, runValidators: true }
            ),
            Employees.findByIdAndUpdate(
                employee._id,
                employeeUpdate,
                { returnDocument: after, runValidators: true }
            )
        ]);

        return res.status(200).json({
            message: "User updated successfully",
            user: updatedUser,
            employee: updatedEmployee
        });

    } catch (err) {
        console.error("Error during user updation:", err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};