const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const Patients = require("../models/Patients");
const Roles = require("../models/Roles")
const sendMail = require("../utils/sendmail");

exports.signupByUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      department,
      designation,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      weeklySchedule,
    } = req.body;

    const existingUser = await Users.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "Email already exists" });

    if (medicalRegistrationNo) {
      const medicalRegNo = await Employees.findOne({ medicalRegistrationNo });
      if (medicalRegNo) {
        return res
          .status(409)
          .json({ message: "Medical Registration no. already exists." });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newEmployee = await Employees.create({
      email,
      name,
      phone,
      department,
      designation,
      joiningDate,
      status: "ADMIN_APPROVAL_PENDING",
      role: role.toUpperCase(),
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      weeklySchedule,
    });

    const employeeID = newEmployee.employeeCode;

    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expiry = Date.now() + 60 * 60 * 24 * 1000; // 24 hours

    const newUser = await Users.create({
      email,
      passwordHash,
      role: role.toUpperCase(),
      status: "ADMIN_APPROVAL_PENDING",
      employeeID,
      isEmailVerified: false,
      verification_token,
      verification_expiry,
    });

    await sendMail({
      to: newUser.email,
      subject: "HMS | Please verify your email address",
      htmlContent: `
        <h2>Welcome to HMS, ${name}</h2>
        <p>Before the Admin can approve your account, you must verify your email address.</p>
        <a href="${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${newUser.email}&token=${verification_token}">
          <button style="padding: 10px 20px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Verify Email
          </button>
        </a>
        <p>This link expires in 24 hours.</p>
      `,
    });

    console.log(
      `${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}`,
    );
    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      user: { employeeID },
      verifyEmailUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}`,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.signUpByAdmin = async (req, res) => {
  try {
    const {
      name,
      role,
      email,
      department,
      designation,
      phone,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      weeklySchedule,
    } = req.body;

    const existingUser = await Employees.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const targetMedicalRoles = new Set([
      "Doctor",
      "Nurse",
      "Pharmacist",
      "Lab_Tech",
    ]);
    const hasMedicalRole = targetMedicalRoles.has(role);

    if (hasMedicalRole) {
      const medicalRegNo = await Employees.findOne({ medicalRegistrationNo });
      if (medicalRegNo) {
        return res
          .status(409)
          .json({ message: "Medical registration no should be unique." });
      }
    }

    const tempPassword = crypto.randomBytes(6).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const profile = await Employees.create({
      name,
      email,
      department,
      designation,
      status: "PASSWORD_CHANGE_PENDING",
      phone,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      weeklySchedule,
    });

    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expiry = Date.now() + 60 * 60 * 24 * 1000;

    const user = await Users.create({
      email,
      passwordHash,
      role: role,
      employeeID: profile.employeeCode,
      verification_token,
      verification_expiry,
      status: "PASSWORD_CHANGE_PENDING",
    });

    await sendMail({
      to: user.email,
      subject: "HMS Employee Credentials",
      htmlContent: `
        <h2>Welcome to HMS</h2>
        <p>Your account credentials:</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p>Please change your password immediately after your first sign in.</p>
      `,
    });

    await sendMail({
      to: user.email,
      subject: "HMS System | User Email Verification",
      htmlContent: `
        <h1>Hospital Management System</h1>
        <p>Thank you ${profile.name} for registering. Verify your account below:</p>
        <a href="${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}">
          <button>Verify Email</button>
        </a>
      `,
    });

    console.log("temp password:", tempPassword);
    console.log(
      `verify url: ${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}`,
    );
    return res.status(201).json({
      message: "Account created successfully.",
      email,
      verifyEmailUrl: `${process.env.APP_URL || "http://localhost:5000"}/api/email/verify-email?email=${user.email}&token=${verification_token}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during signup" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, clientType } = req.body;

    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!clientType) {
      return res
        .status(400)
        .json({
          message: "Client type (MOBILE or WEB) is required for login.",
        });
    }

    if (clientType === "MOBILE" && user.role !== "PATIENT") {
      return res.status(403).json({
        message:
          "Access Denied: Staff and Admin accounts cannot log in via the mobile app.",
      });
    }

    if (clientType === "WEB" && user.role === "PATIENT") {
      return res.status(403).json({
        message:
          "Access Denied: Patient accounts must use the mobile application to log in.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
      });
    }

    if (user.status === "ADMIN_APPROVAL_PENDING") {
      return res.status(403).json({
        message:
          "Your account is currently pending Admin approval. Please check back later.",
      });
    }

    if (user.status === "PASSWORD_CHANGE_PENDING") {
      return res.status(200).json({
        requiresPasswordChange: true,
        email: user.email,
        message: "Security requirement: Please update your default password.",
      });
    }

    const roleExists = await Roles.findOne({ roleName: user.role });
    const permissions = roleExists ? roleExists.rolePermissions : [];

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        employeeID: user.employeeID,
        email: user.email,
        role: user.role,
        permissions: permissions
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    let profile;
    if (user.role === "PATIENT") {
      profile = await Patients.findOne({ email: user.email }).select("-__v");
    } else {
      profile = await Employees.findOne({ email: user.email }).select("-__v");
    }

    if (!profile) {
      return res.status(404).json({
        message: `Login successful, but ${user.role} profile is missing.`,
      });
    }

    res.status(200).json({
      message: "Login successful",
      token,
      user: { profile, role: user.role },
    });
  } catch (err) {
    console.error("Login error: ", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.changeFirstPassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await Users.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ message: "Authentication failed" });

    const salt = await bcrypt.genSalt(10);

    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.status = "ACTIVE";
    await user.save();

    await Employees.findOneAndUpdate(
      { employeeCode: user.employeeID },
      { $set: { status: "ACTIVE" } },
    );

    const token = jwt.sign(
      { employeeID: user.employeeID, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    res.status(200).json({
      token,
      user,
      message: "Password updated successfully. Logging in...",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update password" });
  }
};
