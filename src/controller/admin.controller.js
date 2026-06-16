const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const Department = require('../models/department.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');

const medicalRoles = new Set(['Doctor', 'Nurse']);

const findUserByEmployeeId = asyncHandler(async (employeeId) => {
    return await User.findOne({ employeeId });
});

const changeUserStatus = asyncHandler(async (req, res, status, sucessMessage) => {
    const employeeId = req.body.employeeId;
    const user = await findUserByEmployeeId(employeeId);

    if (!user) {
        throw ERR.userNotFound();
    }

    if (user.status === "Active") {
        if (user.status === status) {
            throw ERR.alreadyActivated();
        }
    }
    else {
        if (user.status === status) {
            throw ERR.alreadyNotActivated();
        }
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
        message: sucessMessage,
        employeeId: user.employeeId,
    });
});

const deleteUserProfile = asyncHandler(async (req, res) => {
    const EmployeeId = req.body.employeeId;

    const existingUser = await findUserByEmployeeId(EmployeeId);
    if (!existingUser) {
        throw ERR.userNotFound();
    }

    const existingEmployee = await Employee.findOneAndDelete({ employeeCode: EmployeeId });
    if (!existingEmployee) {
        throw ERR.employeeNotFound();
    }

    await existingUser.deleteOne();

    return res.status(200).json({
        message: 'Account deleted successfully',
        employeeId: EmployeeId,
    });
});

const getDashboardData = asyncHandler(async (req, res) => {
    const [employeeCount, activeCount, pendingApprovalCount, pendingVerifyCount, patientCount, appointmentCount, departmentCount] = await Promise.all([
        Employee.countDocuments(),
        Employee.countDocuments({ status: 'Active' }),
        User.countDocuments({ status: 'Pending' }),
        User.countDocuments({ isVerified: false }),
        Patient.countDocuments(),
        Appointment.countDocuments(),
        Department.countDocuments(),
    ]);

    return res.status(200).json({
        message: 'Dashboard Data Fetched',
        employeeCount: employeeCount,
        activeCount: activeCount,
        pendingApprovalCount: pendingApprovalCount,
        pendingVerifyCount: pendingVerifyCount,
        patientCount: patientCount,
        departmentCount: departmentCount,
        appointmentCount: appointmentCount,
    });
});

const getUserEmployee = asyncHandler(async (req, res) => {
    const employees = await Employee.find();
    const users = await User.find();

    const employeeMap = new Map(
        employees.map(emp => [emp.employeeCode, emp])
    );

    const combined = users.map((u) => {
        const emp = employeeMap.get(u.employeeId);

        return {
            name: emp?.name || null,
            email: u.email,
            status: u.status,
            role: u.role,
            employeeId: u.employeeId,
            isVerified: u.isVerified,
            firstLogin: u.firstLogin,
            department: emp?.department || null,
            designation: emp?.designation || null,
            joiningDate: emp?.joiningDate || null,
            medicalRegistrationNo: emp?.medicalRegistrationNo || null,
            specialization: emp?.specialization || null,
            qualification: emp?.qualification || null,
            consultationFee: emp?.consultationFee || null,
            availabilitySlots: emp?.availabilitySlots || [],
        };
    });

    return res.status(200).json(combined);
});

const getAllUsers = asyncHandler(async (req, res) => {
    const employee = await Employee.find();
    if (employee.length === 0) {
        throw ERR.noUsersFound();
    }
    return res.status(200).json(employee);
});

const getUsers = asyncHandler(async (req, res) => {
    const user = await User.find();
    if (user.length === 0) {
        throw ERR.noUsersFound();
    }
    return res.status(200).json(user);
});

const approveUser = asyncHandler(async (req, res) => {
    return changeUserStatus(req, res, 'Active', 'Account activated successfully');
});

const rejectUser = asyncHandler(async (req, res) => {
    return changeUserStatus(req, res, 'Inactive', 'Account rejected sucessfully');
});

// Update User Profile
const updateUserProfile = asyncHandler(async (req, res) => {
    const {
        employeeId,
        data,
    } = req.body;

    const existingUser = await findUserByEmployeeId(employeeId);

    if (!existingUser) {
        throw ERR.userNotFound();
    }

    if (medicalRoles.has(existingUser?.role)) {
        if (!data.medicalRegistrationNo) {
            throw ERR.medRoleRequired();
        }
        if (!data.qualification) {
            throw ERR.qualificationRequired();
        }
    }

    await Employee.findOneAndUpdate({ employeeCode: employeeId }, data);

    return res.status(200).json({
        message: "Profile updated successfully!",
    });
});

module.exports = { deleteUserProfile, getDashboardData, getAllUsers, getUsers, approveUser, rejectUser, updateUserProfile, getUserEmployee };

