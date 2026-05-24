const Employee = require("../models/Employee");
const User = require("../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const sendEmployeeCredentials = require("../utils/mailService");
const sendFormSignupMail = require("../utils/formSignupMail");

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
      isFirstLogin: true,
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

//Form Based SignUp
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
            status,
            joiningDate,
            specialization,
            medicalRegistrationNo,
            qualification,} = req.body;

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

            const existingMedicalRegistrationNo = await Employee.findOne({ medicalRegistrationNo });

            if (existingMedicalRegistrationNo) {
                return res.status(400).json({
                    success: false,
                    message:"Medical Registration Number already exists, provide a different one",
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
            status:false,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
        });
        const user = await User.create({
            email,
            status:false,
            password_hash,
            role,
            employeeId: profile.employeeId,
            isFirstLogin: false,
        });

        const empId=await profile.employeeId;
        try {
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
}


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
            status,
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

            const existingMedicalRegistrationNo = await Employee.findOne({ medicalRegistrationNo });

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
            status,
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
            status,
            password_hash,
            role,
            employeeId: profile.employeeId,
            isFirstLogin: true,
        });

        // SEND MAIL

        try {
            await sendEmployeeCredentials(email, tempPassword);
            console.log("Email sent successfully");
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

        if (!user.status) {
            return res.status(403).json({
                message: "Account disabled",
            });
        }

        // VERIFY PASSWORD

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

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
            }
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

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);

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
        });
    } catch (error) {
        console.error("Unable to fetch current user", error);
        return res.status(500).json({ message: error.message });
    }
};


