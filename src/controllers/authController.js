const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const Employees = require("../models/Employees");
const Users = require("../models/Users");
const sendRegMailToAdmin = require("../utils/sendformsignupmail");
const sendMail = require("../utils/sendmail"); 


exports.signupByUser = async (req, res) => {
  try {
    const {
      name, email, password, status, role, phone,
      department, designation, joiningDate, medicalRegistrationNo,
      specialization, qualification, consultationFee, availabilitySlots,
    } = req.body;

    

    const existingUser = await Users.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    if (medicalRegistrationNo) {
      const medicalRegNo = await Employees.findOne({ medicalRegistrationNo });
      if (medicalRegNo) {
        return res.status(409).json({ message: "Medical Registration no. already exists." });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newEmployee = await Employees.create({
      email, name, status, role: role.toUpperCase(), phone, 
      department, designation, joiningDate, medicalRegistrationNo,
      specialization, qualification, consultationFee, availabilitySlots,
    });

    const employeeID = newEmployee.employeeCode

    const newUser = await Users.create({
      email,
      passwordHash,
      role: role.toUpperCase(),
      status,
      employeeID,

      isActivated: false,
    });

    try {
      await sendRegMailToAdmin(process.env.ADMIN_EMAIL || "admin@hms.com", employeeID);
    } catch (mailError) {
      console.error("Mail Service Error:", mailError.message);
    }

    res.status(201).json({
      message: "Registered but Admin approval pending",
      user: { employeeID },
      newUser
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
      status,
      phone,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
    } = req.body;

    const existingUser = await Employees.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const targetMedicalRoles = new Set(["Doctor", "Nurse", "Pharmacist", "Lab_Tech"]);
    const hasMedicalRole = targetMedicalRoles.has(role);

    if (hasMedicalRole) {
      const medicalRegNo = await Employees.findOne({ medicalRegistrationNo });
      if (medicalRegNo) {
        return res.status(409).json({ message: "Medical registration no should be unique." });
      }
    }

    const tempPassword = crypto.randomBytes(12).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const profile = await Employees.create({
      name,
      email,
      department,
      designation,
      status,
      phone,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
    });

    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expiry = Date.now() + 60 * 60 * 24 * 1000;

    const user = await Users.create({
      email,
      passwordHash,
      status,
      role: role,
      employeeID: profile.employeeCode,
      verification_token,
      verification_expiry,
      isActivated: true,
      isVerified: false,
      isFirstLogin: true
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
        <a href="${process.env.APP_URL || 'http://localhost:8080'}/auth/verify-email?email=${user.email}&token=${verification_token}">
          <button>Verify Email</button>
        </a>
      `,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      email,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error during signup" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Users.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    if (user.isFirstLogin) {
      return res.status(200).json({
        requiresPasswordChange: true,
        email: user.email,
        message: 'Security requirement: Please update your default password.'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        employeeID: user.employeeID, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const profile = await Employees.findOne({ email: user.email }).select("-__v");

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
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Authentication failed' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.isFirstLogin = false; 
    await user.save();

    const token = jwt.sign({ employeeID: user.employeeID,email: user.email, role: user.role }, process.env.JWT_SECRET,  { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    
    res.status(200).json({ token, user, message: 'Password updated successfully. Logging in...' });

  } catch (error) {
    res.status(500).json({ message: error.message});
  }
};