const Employee = require("../models/Employee");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Role = require("../models/Role");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

const sendEmployeeCredentials = require("../utils/mailService");
const sendFormSignupMail = require("../utils/formSignupMail");

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");

exports.dashboardStats = asyncHandler(async (req, res) => {
  const totalEmployees = await Employee.countDocuments();
  const activeEmployees = await Employee.countDocuments({ status: true });
  const pendingApprovals = await Employee.countDocuments({ status: false });
  const pendingVerifications = await User.countDocuments({ isFirstLogin: true });
  const totalPatients = await Patient.countDocuments();
  const totalAppointments = await Appointment.countDocuments();
  const totalDepartments = await Employee.distinct("department");

  return res.status(200).json(
    new ApiResponse(200, "Dashboard stats fetched successfully", {
      totalEmployees,
      activeEmployees,
      pendingApprovals,
      pendingVerifications,
      totalPatients,
      totalAppointments,
      totalDepartments: totalDepartments.length,
    })
  );
});

//Form Based SignUp
exports.formSignUp = asyncHandler(async (req, res) => {
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
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(401, "User already exists", "USER_EXISTS");
  }

  const existingEmployee = await Employee.findOne({ email });
  if (existingEmployee) {
    throw new ApiError(401, "User already exists", "USER_EXISTS");
  }

  if (role === "doctor") {
    if (!medicalRegistrationNo) {
      throw new ApiError(
        400,
        "Medical Registration Number is required",
        "VALIDATION_ERROR"
      );
    }

    const existingMedicalRegistrationNo = await Employee.findOne({
      medicalRegistrationNo,
    });

    if (existingMedicalRegistrationNo) {
      throw new ApiError(
        400,
        "Medical Registration Number already exists, provide a different one",
        "DUPLICATE_REGISTRATION_NO"
      );
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
  });

  const user = await User.create({
    email,
    status: false,
    password_hash,
    role,
    employeeId: profile.employeeId,
    isFirstLogin: false,
  });

  const empId = profile.employeeId;
  try {
    await sendFormSignupMail("hmsadmin1235@gmail.com", empId);
    console.log("Email sent successfully");
  } catch (mailError) {
    console.error("Mail Service Error:", mailError.message);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Registered but Admin approval pending", { employee: profile, user }));
});

// ===============================
// ADMIN SIGNUP
// ===============================

exports.signup = asyncHandler(async (req, res) => {
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
    throw new ApiError(403, "Cannot create this role", "FORBIDDEN_ROLE");
  }

  // VALIDATE DOCTOR REGISTRATION NUMBER
  if (role === "doctor") {
    if (!medicalRegistrationNo) {
      throw new ApiError(
        400,
        "Medical Registration Number is required",
        "VALIDATION_ERROR"
      );
    }

    if (consultationFee === undefined || consultationFee === null || consultationFee === "") {
      throw new ApiError(
        400,
        "Consultation Fee is required",
        "VALIDATION_ERROR"
      );
    }

    const existingMedicalRegistrationNo = await Employee.findOne({
      medicalRegistrationNo,
    });

    if (existingMedicalRegistrationNo) {
      throw new ApiError(
        400,
        "Medical Registration Number already exists, provide a different one",
        "DUPLICATE_REGISTRATION_NO"
      );
    }
  }

  // CHECK EXISTING EMPLOYEE
  const existEmployee = await Employee.findOne({ email });
  if (existEmployee) {
    throw new ApiError(409, "Email Id Already Registered", "EMAIL_EXISTS");
  }

  // CHECK EXISTING USER
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User already exists", "USER_EXISTS");
  }

  // GENERATE TEMP PASSWORD
  const tempPassword = crypto.randomBytes(4).toString("hex");
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

  return res
    .status(201)
    .json(new ApiResponse(201, "Employee Registered Successfully", { employee: profile, user }));
});

// ===============================
// LOGIN
// ===============================

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User Not Found", "USER_NOT_FOUND");
  }

  if (!user.status) {
    throw new ApiError(403, "Account disabled", "ACCOUNT_DISABLED");
  }

  const isPasswordValid = Boolean(
    await bcrypt.compare(password, user.password_hash)
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

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

  if (user.isFirstLogin) {
    return res.status(200).json(
      new ApiResponse(200, "Password change required", {
        firstLogin: true,
        token,
        user: { id: user._id, email: user.email, role: user.role },
      })
    );
  }

  user.last_login = new Date();
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      token,
      user: { id: user._id, email: user.email, role: user.role },
    })
  );
});

// ===============================
// RESET PASSWORD
// ===============================

exports.resetPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (!user.isFirstLogin) {
    throw new ApiError(403, "Password reset not allowed", "FORBIDDEN");
  }

  const isOldPasswordValid = Boolean(
    await bcrypt.compare(oldPassword, user.password_hash)
  );

  if (!isOldPasswordValid) {
    throw new ApiError(401, "Invalid temporary password", "INVALID_CREDENTIALS");
  }

  if (!newPassword || newPassword.length < 8) {
    throw new ApiError(
      400,
      "Password must be at least 8 characters",
      "VALIDATION_ERROR"
    );
  }

  const password_hash = await bcrypt.hash(newPassword, 12);

  user.password_hash = password_hash;
  user.isFirstLogin = false;
  user.last_login = new Date();
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully"));
});

// ===============================
// UPDATE EMPLOYEE (SELF)
// ===============================
exports.updateEmployeeById = asyncHandler(async (req, res) => {
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

  const user = await User.findById(req.user.id).select("-password_hash -__v");
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  if (employeeId !== user.employeeId) {
    throw new ApiError(403, "You can only update your own profile", "FORBIDDEN");
  }

  const existEmployee = await Employee.findOne({ employeeId });
  if (!existEmployee) {
    throw new ApiError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
  }

  if (name) existEmployee.name = name;
  if (phone) existEmployee.phone = phone;
  if (specialization) existEmployee.specialization = specialization;
  if (consultationFee) existEmployee.consultationFee = consultationFee;
  if (availabilitySlots) existEmployee.availabilitySlots = availabilitySlots;
  if (department) existEmployee.department = department;
  if (designation) existEmployee.designation = designation;

  await existEmployee.save();

  user.updated_at = new Date();
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      `Employee with id ${existEmployee.employeeId} updated successfully`,
      { employee: existEmployee }
    )
  );
});

// ===============================
// CURRENT USER
// ===============================

exports.currentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password_hash -__v");
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const employee = await Employee.findOne({ employeeId: user.employeeId });
  if (!employee) {
    throw new ApiError(404, "Employee profile not found", "EMPLOYEE_NOT_FOUND");
  }

  const baseData = {
    id: user.employeeId,
    email: user.email,
    role: user.role,
    name: employee.name,
    phone: employee.phone,
    department: employee.department,
    designation: employee.designation,
    status: employee.status,
    joiningDate: employee.joiningDate,
    qualification: employee.qualification,
  };

  if (["doctor", "nurse", "lab_Tech", "pharmacist"].includes(user.role)) {
    baseData.medicalRegistrationNo = employee.medicalRegistrationNo;
    baseData.specialization = employee.specialization;
    baseData.consultationFee = employee.consultationFee;
    baseData.availabilitySlots = employee.availabilitySlots;
  }

  const roleDoc = await Role.findOne({ role_name: user.role }).select("role_permissions");
  baseData.permissions = roleDoc?.role_permissions || [];

  return res
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", baseData));
});

//===========================
//Get Employees (PAGINATED)
//===========================
exports.getEmployees = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const totalCount = await Employee.countDocuments();

  const employees = await Employee.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const employeeData = await Promise.all(
    employees.map(async (employee) => {
      const user = await User.findOne({ employeeId: employee.employeeId });

      return {
        ...employee.toObject(),
        role: user?.role || "",
      };
    })
  );

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Employees fetched successfully", employeeData, meta));
});

//===========================
//Delete Employee
//===========================
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await Employee.findOne({ employeeId });
  if (!employee) {
    throw new ApiError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
  }

  await User.deleteOne({ employeeId });
  await employee.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, "Employee deleted successfully"));
});

//===========================
//Update Employee By Admin
//===========================
exports.updateEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await Employee.findOne({ employeeId });
  if (!employee) {
    throw new ApiError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
  }

  Object.assign(employee, req.body);
  await employee.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Employee updated successfully", { employee }));
});

//===========================
//Get Pending Approvals (Employees awaiting admin sign-off after formSignUp)
//===========================
exports.getPendingApprovals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const totalCount = await Employee.countDocuments({ status: false });

  const pendingEmployees = await Employee.find({ status: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const data = await Promise.all(
    pendingEmployees.map(async (employee) => {
      const user = await User.findOne({ employeeId: employee.employeeId });

      return {
        employeeId: employee.employeeId,
        email: employee.email,
        role: user?.role || "",
        isFirstLogin: user?.isFirstLogin ?? null,
      };
    })
  );

  const meta = buildPaginationMeta(page, limit, totalCount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Pending approvals fetched successfully", data, meta));
});

//===========================
//Approve Employee (activates both Employee profile and User login)
//===========================
exports.approveEmployee = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;

  const employee = await Employee.findOne({ employeeId });
  if (!employee) {
    throw new ApiError(404, "Employee not found", "EMPLOYEE_NOT_FOUND");
  }

  const user = await User.findOne({ employeeId });
  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  employee.status = true;
  user.status = true;
  await employee.save();
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Employee approved successfully", { employee }));
});

//===========================
//Approval Stats
//===========================
exports.approvalStats = asyncHandler(async (req, res) => {
  const pendingApprovals = await Employee.countDocuments({ status: false });
  const verifiedUsers = await User.countDocuments({ isFirstLogin: false });
  const inactiveAccounts = await User.countDocuments({ status: false });
  const firstLoginPending = await User.countDocuments({ isFirstLogin: true });

  return res.status(200).json(
    new ApiResponse(200, "Approval stats fetched successfully", {
      pendingApprovals,
      verifiedUsers,
      inactiveAccounts,
      firstLoginPending,
    })
  );
});