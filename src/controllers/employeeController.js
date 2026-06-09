const Employee = require("../models/Employee");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const sendEmployeeCredentials = require("../utils/mailService");
const sendFormSignupMail = require("../utils/formSignupMail");
const mailVerification = require("../utils/mailVerification");

//===============================
//Dashboard-Stats
//===============================
exports.dashboardStats = async (req, res) => {
  try {
    // TOTAL EMPLOYEES

    const totalEmployees = await Employee.countDocuments();

    // ACTIVE EMPLOYEES

    const activeEmployees = await Employee.countDocuments({
      status: true,
    });

    // PENDING APPROVALS
    const pendingApprovals = await Employee.countDocuments({
      status: false,
    });
    // PENDING VERIFICATIONS
    const pendingVerifications = await User.countDocuments({
      isVerified: false,
    });
    // TOTAL PATIENTS
    const totalPatients = await Patient.countDocuments();
    // TOTAL APPOINTMENTS
    const totalAppointments = await Appointment.countDocuments();
    // DEPARTMENTS COUNT
    const totalDepartments = await Employee.distinct("department");

    return res.status(200).json({
      totalEmployees,
      activeEmployees,
      pendingApprovals,
      pendingVerifications,
      totalPatients,
      totalAppointments,
      totalDepartments: totalDepartments.length,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);

    return res.status(500).json({
      message: "Unable to fetch dashboard stats",
    });
  }
};

//==========================================
//PENDING APPROVALS
//==========================================

exports.getPendingApprovals = async (req, res) => {
  try {
    const users = await User.find({
      status: false,
    });

    const pendingUsers = await Promise.all(
      users.map(async (user) => {
        const employee = await Employee.findOne({
          employeeId: user.employeeId,
        });

        return {
          employeeId: user.employeeId,
          name: employee?.name || "",
          email: user.email,
          role: user.role,
          status: user.status,
          isFirstLogin: user.isFirstLogin,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Unable To Fetch Pending Approvals",
    });
  }
};

//======================================
//Approve Employees
//======================================
exports.approveEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const user = await User.findOne({
      employeeId,
    });

    const employee = await Employee.findOne({
      employeeId,
    });

    if (!user || !employee) {
      return res.status(404).json({
        message: "Employee Not Found",
      });
    }

    user.status = true;
    employee.status = true;

    await user.save();
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee Approved Successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Unable To Approve Employee",
    });
  }
};
//======================================
//Approval Dashboard Stats
//======================================
exports.getApprovalStats = async (req, res) => {
  try {
    const pendingApprovals = await User.countDocuments({
      status: false,
    });

    const verifiedUsers = await User.countDocuments({
      status: true,
    });

    const inactiveAccounts = await Employee.countDocuments({
      status: false,
    });

    const firstLoginPending = await User.countDocuments({
      isFirstLogin: true,
    });

    return res.status(200).json({
      pendingApprovals,

      verifiedUsers,

      inactiveAccounts,

      firstLoginPending,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Unable To Fetch Approval Stats",
    });
  }
};

//======================================
//Form Based SignUp
//======================================
exports.formSignUp = async (req, res) => {
  try {
    const {
      email,
      name,
      password,
      role,
      phone,
      department,
      designation,
      joiningDate,
      specialization,
      medicalRegistrationNo,
      qualification,
      consultationFee,
      availabilitySlots,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({ message: "User already exists" });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(401).json({ message: "User already exists" });
    }

    if (role === "doctor") {
      if (!medicalRegistrationNo) {
        return res.status(400).json({
          success: false,
          message: "Medical Registration Number is required",
        });
    }

        if (!availabilitySlots || availabilitySlots.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Please select at least one availability slot",
          });
        }
      

      const existingMedicalRegistrationNo = await Employee.findOne({
        medicalRegistrationNo,
      });

      if (existingMedicalRegistrationNo) {
        return res.status(400).json({
          success: false,
          message:
            "Medical Registration Number already exists, provide a different one",
        });
      }
    }

    const password_hash = await bcrypt.hash(password, 12);
    const profile = await Employee.create({
      email,
      name,
      phone,
      department,
      designation,
      status: false,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee: consultationFee || 0,
      availabilitySlots: availabilitySlots || [],
    });
    const user = await User.create({
      email,
      status: false,
      isVerified: false,
      password_hash,
      role,
      employeeId: profile.employeeId,
      isFirstLogin: false,
    });

    const empId = await profile.employeeId;
    try {
      await mailVerification(email, profile.employeeId);
      console.log("Verification email sent successfully");
      await sendFormSignupMail("hmsadmin1235@gmail.com", empId);
      console.log("Email sent successfully");
    } catch (mailError) {
      console.error("Mail Service Error:", mailError.message);
    }
    return res.status(201).json({
      message: "Registered but Admin approval pending",
      employee: profile,
      user: user,
    });
  } catch (error) {
    console.error("Unable to fetch current user", error);
    return res.status(500).json({ message: error.message });
  }
};

// ===============================
// ADMIN SIGNUP
// ===============================

exports.signup = async (req, res) => {
  try {
    const {
      email,
      name,
      role,
      phone,
      department,
      designation,
      joiningDate,
      specialization,
      medicalRegistrationNo,
      qualification,
      consultationFee,
      availabilitySlots,
    } = req.body;

    // BLOCK ADMIN
    if (["admin", "owner"].includes(role)) {
      return res.status(403).json({
        message: "Cannot create this role",
      });
    }

    // VALIDATE DOCTOR REGISTRATION NUMBER

    if (role === "doctor") {
      if (!medicalRegistrationNo) {
        return res.status(400).json({
          success: false,
          message: "Medical Registration Number is required",
        });
      }

      const existingMedicalRegistrationNo = await Employee.findOne({
        medicalRegistrationNo,
      });

      if (existingMedicalRegistrationNo) {
        return res.status(400).json({
          success: false,
          message:
            "Medical Registration Number already exists, provide a different one",
        });
      }
    }

    // CHECK EXISTING EMPLOYEE

    const existEmployee = await Employee.findOne({ email });

    if (existEmployee) {
      return res.status(409).json({
        message: "Email Id Already Registered",
      });
    }

    // CHECK EXISTING USER

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    // GENERATE TEMP PASSWORD

    const tempPassword = crypto.randomBytes(4).toString("hex");

    // HASH PASSWORD

    const password_hash = await bcrypt.hash(tempPassword, 12);

    // CREATE EMPLOYEE PROFILE

    const profile = await Employee.create({
      email,
      name,
      phone,
      department,
      designation,
      status: true,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
    });

    // CREATE USER

    const user = await User.create({
      email,
      status: true,
      isVerified: false,
      password_hash,
      role,
      employeeId: profile.employeeId,
      isFirstLogin: true,
    });

    // SEND MAIL

    try {
      await sendEmployeeCredentials(email, tempPassword);
      await mailVerification(email, profile.employeeId);

      console.log("Credentials and Verification Email Sent Successfully");
    } catch (mailError) {
      console.error("Mail Service Error:", mailError.message);
    }

    console.log("Temporary Password:", tempPassword);

    return res.status(201).json({
      message: "Employee Registered Successfully",
      employee: profile,
      user: user,
    });
  } catch (err) {
    console.error("Signup error:", err);

    return res.status(500).json({
      message: "Server error during signup",
    });
  }
};

// ===============================
// LOGIN
// ===============================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // FIND USER

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    // CHECK ACCOUNT STATUS

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    if (!user.status) {
      return res.status(403).json({
        message: "Account disabled",
      });
    }

    // VERIFY PASSWORD

    const isPasswordValid = Boolean(
      await bcrypt.compare(password, user.password_hash),
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // GENERATE TOKEN

    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    // FIRST LOGIN CHECK

    if (user.isFirstLogin) {
      return res.status(200).json({
        message: "Password change required",
        firstLogin: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      });
    }

    // NORMAL LOGIN

    user.last_login = new Date();

    await user.save();

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// ===============================
// RESET PASSWORD
// ===============================

exports.resetPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // FIND USER
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // ONLY FIRST LOGIN USERS
    if (!user.isFirstLogin) {
      return res.status(403).json({
        message: "Password reset not allowed",
      });
    }

    // VERIFY TEMP PASSWORD

    const isOldPasswordValid = Boolean(
      await bcrypt.compare(oldPassword, user.password_hash),
    );

    if (!isOldPasswordValid) {
      return res.status(401).json({
        message: "Invalid temporary password",
      });
    }

    // VALIDATE PASSWORD

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // HASH NEW PASSWORD

    const password_hash = await bcrypt.hash(newPassword, 12);

    // UPDATE USER

    user.password_hash = password_hash;
    user.isFirstLogin = false;
    user.last_login = new Date();
    await user.save();
    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({
      message: "Server error during password reset",
    });
  }
};

// ===============================
// UPDATE EMPLOYEE
// ===============================
exports.updateEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const {
      name,
      phone,
      specialization,
      consultationFee,
      availabilitySlots,
      department,
      designation,
    } = req.body;

    // FIND USER

    const user = await User.findById(req.user.id).select("-password_hash -__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ALLOW ONLY OWN PROFILE UPDATE

    if (employeeId !== user.employeeId) {
      return res.status(403).json({
        message: "You can only update your own profile",
      });
    }

    // FIND EMPLOYEE

    const existEmployee = await Employee.findOne({
      employeeId,
    });

    if (!existEmployee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // UPDATE FIELDS

    if (name) existEmployee.name = name;

    if (phone) existEmployee.phone = phone;

    if (specialization) existEmployee.specialization = specialization;

    if (consultationFee) existEmployee.consultationFee = consultationFee;

    if (availabilitySlots) existEmployee.availabilitySlots = availabilitySlots;

    if (department) existEmployee.department = department;

    if (designation) existEmployee.designation = designation;

    // SAVE

    await existEmployee.save();

    user.updated_at = new Date();

    await user.save();

    return res.status(200).json({
      message: `Employee with id ${existEmployee.employeeId} updated successfully`,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);

    return res.status(500).json({
      message: "Server error during updating employee",
    });
  }
};

// ===============================
// CURRENT USER
// ===============================

exports.currentUser = async (req, res) => {
  try {
    // FIND USER

    const user = await User.findById(req.user.id).select("-password_hash -__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // FIND EMPLOYEE

    const employee = await Employee.findOne({
      employeeId: user.employeeId,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found",
      });
    }

    // RESPONSE

    if (["doctor", "nurse", "lab_Tech", "pharmacist"].includes(user.role)) {
      return res.status(200).json({
        id: user.employeeId,
        email: user.email,
        role: user.role,
        name: employee.name,
        phone: employee.phone,
        department: employee.department,
        medicalRegistrationNo: employee.medicalRegistrationNo,
        designation: employee.designation,
        status: employee.status,
      });
    }

    return res.status(200).json({
      id: user.employeeId,
      email: user.email,
      role: user.role,
      name: employee.name,
      phone: employee.phone,
      department: employee.department,
      designation: employee.designation,
      status: employee.status,
    });
  } catch (error) {
    console.error("Unable to fetch current user", error);
    return res.status(500).json({ message: error.message });
  }
};

//Get Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });

    const employeeData = await Promise.all(
      employees.map(async (employee) => {
        const user = await User.findOne({
          employeeId: employee.employeeId,
        });

        return {
          ...employee.toObject(),
          role: user?.role || "",
        };
      }),
    );

    return res.status(200).json({
      success: true,
      count: employeeData.length,
      data: employeeData,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server error during fetch employees",
    });
  }
};

//Delete Employees
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findOne({
      employeeId,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    await User.deleteOne({
      employeeId,
    });

    await employee.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Server error during delete employee",
    });
  }
};

//====================================================
//Verify Mail
//====================================================
exports.verifyEmail = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const user = await User.findOne({
      employeeId,
    });

    if (!user) {
      return res.status(404).send("User Not Found");
    }

    user.isVerified = true;

    await user.save();

    return res.send(`
      <h2>Email Verified Successfully</h2>
      <p>You can now login to HMS.</p>
    `);
  } catch (err) {
    console.error(err);

    return res.status(500).send("Verification Failed");
  }
};
