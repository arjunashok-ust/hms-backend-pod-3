const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const jwt = require('jsonwebtoken');
const Department = require('../models/department.model');

const showError = (res, err, message) => {
    console.error(err);
    return res.status(500).json({ message: message });
}

const findUserByEmployeeId = async (employeeId) => {
    return await User.findOne({employeeId});
}

const changeUserStatus = async (req, res, status, alreadyMessage, sucessMessage) => {
    try {
        const employeeId = req.body.employeeId;
        const user = await findUserByEmployeeId(employeeId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.status == status) {
            return res.status(403).json({ message: alreadyMessage });
        }

        user.status = status;
        await user.save();

        return res.status(200).json({
            message: sucessMessage,
            employeeId: user.employeeId,
        });
    } catch (err) {
        showError(res, err, 'Server Error During Approve User');
    }
}

const deleteUserProfile = async (req, res) => {
    try {
        const EmployeeId = req.body.employeeId;
        const existingUser = await findUserByEmployeeId(EmployeeId);
        if (!existingUser) {
            return res.status(404).json({ message: 'user not found.' });
        }

        await existingUser.deleteOne();

        const existingEmployee = await Employee.findOneAndDelete({ employeeCode: EmployeeId });
        if (!existingEmployee) {
            return res.status(404).json({ message: 'employee not found.' });
        }
        return res.status(200).json({
            message: 'Account deleted successfully',
            employeeId: EmployeeId,
        });
    } catch (err) {
        showError(res, err, "server error during delete user profile.");
    }
}

const getDashboardData = async (req, res) => {
    try {
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
    }
    catch (err) {
        showError(res, err, 'Server Error During Get Dashboard Data');
    }
}

const getAllUsers = async (req, res) => {
    try {
        const employee = await Employee.find();

        return res.status(200).json(employee);
    } catch (err) {
        showError(res, err, 'Server Error During Get All Users');
    }
}

const getUsers = async (req, res) => {
    try {
        const user = await User.find();
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(200).json(user);
    } catch (err) {
        showError(res, err, 'Server Error During Get All Users');
    }
}

const approveUser = async (req, res) => {
    return changeUserStatus(req, res, 'Active', 'Account is already activated', 'Account activated sucessfully');
}

const rejectUser = async (req, res) => {
    return changeUserStatus(req,res,'Inactive','Account is already not active','Account activation request rejected sucessfully');
}

// Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        const {
            employeeId,
            data,
        } = req.body;

        const existingUser = await findUserByEmployeeId(employeeId);

        if (!existingUser) {
            return res.status(404).json({ message: "User not found!" });
        }

        await Employee.findOneAndUpdate({ employeeCode: employeeId }, data);

        return res.status(200).json({
            message: "Profile updated sucessfully!",
        });
    }
    catch (err) {
        showError(res, err, `Server error during update profile`);
    }
}

module.exports = { deleteUserProfile, getDashboardData, getAllUsers, getUsers, approveUser, rejectUser, updateUserProfile };

