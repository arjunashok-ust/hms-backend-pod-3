const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const Department = require('../models/department.model');
const MedicalRecord = require('../models/medical-record.model');
const Role = require('../models/role.model');

const ERR = require('../utils/errors.utils');
const { toSkip, buildPage } = require('../utils/pagination.utils');
const { employeeRoleIssues } = require('../utils/employeeRules.utils');
const { pickDefined } = require('../utils/object.utils');
const { SUCCESS_MESSAGES } = require('../constants/messages.constants');
const { ROLES, QUALIFICATION_REQUIRED_ROLES } = require('../constants/roles.constants');
const { USER_STATUS, APPOINTMENT_STATUS, SENSITIVE_USER_FIELDS } = require('../constants/app.constants');

const findActiveUserByEmployeeId = (employeeId) => User.findOne({ employeeId, isDeleted: false });

const changeUserStatus = async ({ employeeId }, status, message) => {
    const user = await findActiveUserByEmployeeId(employeeId);
    if (!user) throw ERR.userNotFound();

    if (user.status === status) {
        throw status === USER_STATUS.ACTIVE ? ERR.alreadyActivated() : ERR.alreadyNotActivated();
    }

    user.status = status;
    await user.save();

    return { message, employeeId: user.employeeId };
};

const approveUser = (input) => changeUserStatus(input, USER_STATUS.ACTIVE, SUCCESS_MESSAGES.ACCOUNT_ACTIVATED);

const rejectUser = (input) => changeUserStatus(input, USER_STATUS.INACTIVE, SUCCESS_MESSAGES.ACCOUNT_REJECTED);

const deleteUserProfile = async (actor, { employeeId }) => {
    const user = await findActiveUserByEmployeeId(employeeId);
    if (!user) throw ERR.userNotFound();

    const deletion = { isDeleted: true, deletedBy: actor.userId, deletedAt: new Date() };

    const employee = await Employee.findOneAndUpdate({ employeeCode: employeeId }, { $set: deletion });
    if (!employee) throw ERR.employeeNotFound();

    if (user.role === ROLES.DOCTOR) {
        await Appointment.updateMany(
            { doctorEmployeeId: employeeId, status: APPOINTMENT_STATUS.BOOKED },
            { $set: { status: APPOINTMENT_STATUS.CANCELLED } },
        );
        await Appointment.updateMany({ doctorEmployeeId: employeeId }, { $set: deletion });
        await MedicalRecord.updateMany({ doctorId: employeeId }, { $set: deletion });
    }

    await user.updateOne({ $set: deletion });

    return { message: SUCCESS_MESSAGES.ACCOUNT_DELETED, employeeId };
};

const getDashboardData = async () => {
    const live = { isDeleted: false };

    const [
        employeeCount,
        activeCount,
        inactiveCount,
        verifiedCount,
        pendingApprovalCount,
        pendingVerifyCount,
        pendingFirstLoginCount,
        patientCount,
        appointmentCount,
        departmentCount,
    ] = await Promise.all([
        Employee.countDocuments(live),
        Employee.countDocuments({ status: USER_STATUS.ACTIVE, ...live }),
        Employee.countDocuments({ status: USER_STATUS.INACTIVE, ...live }),
        User.countDocuments({ isVerified: true, ...live }),
        User.countDocuments({ status: USER_STATUS.PENDING, ...live }),
        User.countDocuments({ isVerified: false, ...live }),
        User.countDocuments({ firstLogin: true, ...live }),
        Patient.countDocuments(live),
        Appointment.countDocuments(live),
        Department.countDocuments(),
    ]);

    return {
        employeeCount,
        activeCount,
        inactiveCount,
        verifiedCount,
        pendingApprovalCount,
        pendingVerifyCount,
        pendingFirstLoginCount,
        patientCount,
        departmentCount,
        appointmentCount,
    };
};

const getUserEmployee = async ({ page, limit, selectedText }) => {
    const employeeFilter = { isDeleted: false };
    if (selectedText) employeeFilter.$text = { $search: selectedText };

    const employees = await Employee.find(employeeFilter).lean();
    if (employees.length === 0) return buildPage({ data: [], total: 0, page, limit });

    const employeeByCode = new Map(employees.map((employee) => [employee.employeeCode, employee]));
    const userFilter = {
        isDeleted: false,
        role: { $ne: ROLES.ADMIN },
        employeeId: { $in: [...employeeByCode.keys()] },
    };

    const [total, users] = await Promise.all([
        User.countDocuments(userFilter),
        User.find(userFilter).select(SENSITIVE_USER_FIELDS).sort({ _id: 1 }).skip(toSkip({ page, limit })).limit(limit).lean(),
    ]);

    const data = users.map((user) => {
        const employee = employeeByCode.get(user.employeeId);
        return {
            name: employee?.name ?? null,
            email: user.email,
            status: user.status,
            role: user.role,
            employeeId: user.employeeId,
            isVerified: user.isVerified,
            firstLogin: user.firstLogin,
            department: employee?.department ?? null,
            designation: employee?.designation ?? null,
            joiningDate: employee?.joiningDate ?? null,
            medicalRegistrationNo: employee?.medicalRegistrationNo ?? null,
            specialization: employee?.specialization ?? null,
            qualification: employee?.qualification ?? null,
            consultationFee: employee?.consultationFee ?? null,
            availabilitySlots: employee?.availabilitySlots ?? [],
        };
    });

    return buildPage({ data, total, page, limit });
};

const getAllUsers = async ({ page, limit, selectedText, selectedDepartment }) => {
    const filter = { isDeleted: false };
    if (selectedDepartment) filter.department = selectedDepartment;
    if (selectedText) filter.$text = { $search: selectedText };

    const [total, data] = await Promise.all([
        Employee.countDocuments(filter),
        Employee.find(filter).sort({ _id: 1 }).skip(toSkip({ page, limit })).limit(limit).lean(),
    ]);

    return buildPage({ data, total, page, limit });
};

const getUsers = async () => {
    const users = await User.find({ isDeleted: false }).select(SENSITIVE_USER_FIELDS).lean();
    if (users.length === 0) throw ERR.noUsersFound();
    return users;
};

const updateUserProfile = async ({ employeeId, data }) => {
    const user = await findActiveUserByEmployeeId(employeeId);
    if (!user) throw ERR.userNotFound();

    const issues = employeeRoleIssues(user.role, data);
    if (issues.length > 0) throw ERR.invalidInput(issues.map((issue) => issue.message).join(', '));

    if (QUALIFICATION_REQUIRED_ROLES.includes(user.role) && !data.qualification) {
        throw ERR.qualificationRequired();
    }

    const employee = await Employee.findOneAndUpdate(
        { employeeCode: employeeId, isDeleted: false },
        pickDefined(data),
        { runValidators: true },
    );
    if (!employee) throw ERR.employeeNotFound();

    return { message: SUCCESS_MESSAGES.PROFILE_UPDATED };
};

const getRolesData = () => Role.find().lean();

const updateRole = async ({ roleName, data }) => {
    const role = await Role.findOneAndUpdate(
        { role_name: roleName },
        { role_permissions: data.role_permissions },
        { new: true },
    ).lean();
    if (!role) throw ERR.roleNotFound();

    return role;
};

module.exports = {
    approveUser,
    rejectUser,
    deleteUserProfile,
    getDashboardData,
    getUserEmployee,
    getAllUsers,
    getUsers,
    updateUserProfile,
    getRolesData,
    updateRole,
};
