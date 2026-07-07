const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const Department = require('../models/department.model');
const MedicalRecord = require('../models/medical-record.model');
const Role = require('../models/role.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');

const medicalRoles = new Set(['Doctor', 'Nurse']);

const findUserByEmployeeId = async (employeeId) => {
    return await User.findOne({ employeeId, isDeleted: false });
};

const changeUserStatus = asyncHandler(async (req, res, status, sucessMessage) => {
    const employeeId = req.body.employeeId;
    const user = await findUserByEmployeeId(employeeId);

    if (!user) {
        throw ERR.userNotFound();
    }

    if (user.status == "Active") {
        if (user.status === status) {
            throw ERR.alreadyActivated();
        }
    }
    else if (user.status === status) {
        throw ERR.alreadyNotActivated();
    }

    user.status = status;
    await user.save();

    return res.status(200).json({
        message: sucessMessage,
        employeeId: user.employeeId,
    });
});

const deleteUserProfile = asyncHandler(async (req, res) => {
    const employeeId = req.body.employeeId;

    const existingUser = await findUserByEmployeeId(employeeId);
    if (!existingUser) {
        throw ERR.userNotFound();
    }

    const existingEmployee = await Employee.findOneAndUpdate(
        { employeeCode: employeeId },
        {
            $set: {
                isDeleted: true,
                deletedBy: req.user.userId,
                deletedAt: new Date(),
            }
        },
        { new: true }
    );

    if (!existingEmployee) {
        throw ERR.employeeNotFound();
    }

    const updateData = {
        isDeleted: true,
        deletedBy: req.user.userId,
        deletedAt: new Date(),
    }

    if (existingUser.role == 'Doctor') {
        // for cancelling any booked appointments
        await Appointment.updateMany({
            doctorEmployeeId: employeeId,
            status: 'Booked',
        }, {
            $set: {
                status: 'Cancelled',
            }
        });

        await Appointment.updateMany({ doctorEmployeeId: employeeId }, { $set: updateData })
        await MedicalRecord.updateMany({ doctorId: employeeId }, { $set: updateData });
    }

    await existingUser.updateOne({ $set: updateData });

    return res.status(200).json({
        message: 'Account deleted successfully',
        employeeId: employeeId,
    });
});

const getDashboardData = asyncHandler(async (req, res) => {
    const [employeeCount, activeCount, inactiveCount, verifiedCount, pendingApprovalCount, pendingVerifyCount, pendingFirstLoginCount, patientCount, appointmentCount, departmentCount] = await Promise.all([
        Employee.countDocuments({ isDeleted: false }),
        Employee.countDocuments({ status: 'Active', isDeleted: false }),
        Employee.countDocuments({ status: 'Inactive', isDeleted: false }),
        User.countDocuments({ isVerified: true, isDeleted: false }),
        User.countDocuments({ status: 'Pending', isDeleted: false }),
        User.countDocuments({ isVerified: false, isDeleted: false }),
        User.countDocuments({ firstLogin: true, isDeleted: false }),
        Patient.countDocuments({ isDeleted: false }),
        Appointment.countDocuments({ isDeleted: false }),
        Department.countDocuments(),
    ]);

    return res.status(200).json({
        message: 'Dashboard Data Fetched',
        employeeCount: employeeCount,
        activeCount: activeCount,
        inactiveCount: inactiveCount,
        verifiedCount: verifiedCount,
        pendingApprovalCount: pendingApprovalCount,
        pendingVerifyCount: pendingVerifyCount,
        pendingFirstLoginCount: pendingFirstLoginCount,
        patientCount: patientCount,
        departmentCount: departmentCount,
        appointmentCount: appointmentCount,
    });
});

const getUserEmployee = asyncHandler(async (req, res) => {
    const selectedText = req.query.selectedText?.trim();
    const page = normalizeNumber(req.query.page, 1);
    const limit = normalizeNumber(req.query.limit, 5);

    const skip = (page - 1) * limit;
    const employeeFilter = { isDeleted: false }

    if (selectedText) {
        employeeFilter.$text = { $search: selectedText };
    }

    const employees = await Employee.find(employeeFilter);

    const employeeMap = new Map(
        employees.map(emp => [emp.employeeCode, emp])
    );

    // for filtering
    const employeeCodes = employees.map(emp => emp.employeeCode);

    const userFilter = {
        role: { $ne: "Admin" }
    }

    if (employeeCodes.length > 0) {
        userFilter.employeeId = { $in: employeeCodes }
    } else {
        return res.status(200).json({
            data: [],
            total: 0,
            page,
            totalPages: 0,
        });
    }

    const total = await User.countDocuments(userFilter);
    const users = await User.find(userFilter).skip(skip).limit(limit);


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

    return res.status(200).json({
        data: combined,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
});

const getAllUsers = asyncHandler(async (req, res) => {
    const selectedText = req.query.selectedText?.trim();
    const selectedDepartment = req.query.selectedDepartment;

    const page = normalizeNumber(req.query.page, 1);
    const limit = normalizeNumber(req.query.limit, 5);

    const skip = (page - 1) * limit;
    const filter = { isDeleted: false }

    if (selectedDepartment) {
        filter.department = selectedDepartment;
    }

    if (selectedText) {
        filter.$text = { $search: selectedText };
    }

    const total = await Employee.countDocuments(filter);

    const employees = await Employee.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit);

    return res.status(200).json({
        data: employees,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
});

const getUsers = asyncHandler(async (req, res) => {
    const user = await User.find({ isDeleted: false });
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

    await Employee.findOneAndUpdate({ employeeCode: employeeId, isDeleted: false }, data);

    return res.status(200).json({
        message: "Profile updated successfully!",
    });
});

const getRolesData = asyncHandler(async (req, res) => {
    const roles = await Role.find();
    return res.status(200).json(roles);
});

const updateRole = asyncHandler(async (req, res) => {
    const roleName = req.body.roleName;
    const data = req.body.data;
    const role = await Role.findOneAndUpdate({ role_name: roleName }, { role_permissions: data.role_permissions }, {
        new: true,
    });
    if (!role) {
        throw ERR.roleNotFound();
    }

    return res.status(200).json(role);
})

const normalizeNumber = (value, defaultValue) => {
    const num = Number.parseInt(value);
    return Number.isNaN(num) || num < 1 ? defaultValue : num;
};

module.exports = {
    deleteUserProfile,
    getDashboardData,
    getAllUsers,
    getUsers,
    approveUser,
    rejectUser,
    updateUserProfile,
    getUserEmployee,
    getRolesData,
    updateRole
};