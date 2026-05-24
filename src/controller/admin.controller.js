const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const jwt = require('jsonwebtoken');
const Department = require('../models/department.model');

const deleteUserProfile = async (req, res) => {
    try {
        // if (!req.user.roles?.includes('Admin')) {
        //     return res.status(401).json({ message: 'not authorized to do this operation.' });
        // }
        const EmployeeId = req.body.employeeId;
        const existingUser = await User.findOne({ employeeId: EmployeeId });
        if (!existingUser) {
            return res.status(404).json({ message: 'user not found.' });
        }
        if (existingUser.role.includes('Admin')) {
            return res.status(401).json({ message: 'no permission to do that.' });
        }

        await existingUser.deleteOne();

        const existingEmployee = await Employee.findOneAndDelete({ employeeCode: EmployeeId });
        if (!existingEmployee) {
            return res.status(404).json({ message: 'employee not found.' });
        }
        return res.status(200).json({
            message: 'account deleted successfully',
            employeeId: EmployeeId,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "server error during delete user profile." });
    }
}

getDashboardData = async (req, res) => {
    try {
        // if (req.user.role) {
        //     return res.status(401).json({ message: 'You are not authorized to do this operation.' });
        // }
        const employeeCount = await Employee.countDocuments();
        const activeCount = await Employee.countDocuments({ status: 'Active' });
        const pendingApprovalCount = await User.countDocuments({ isActivated: false });
        const pendingVerifyCount = await User.countDocuments({ isVerified: false });
        const patientCount = await Patient.countDocuments();
        const appointmentCount = await Appointment.countDocuments();
        const departmentCount = await Department.countDocuments();

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
        return res.status(500).json({ message: 'Server Error During Get Dashboard Data' });
    }
}

const getAllUsers = async (req, res) => {
    try {
        // if (req.user.role) {
        //     return res.status(401).json({ message: 'You are not authorized to do this operation.' });
        // }
        const employee = await Employee.find();

        return res.status(200).json(employee);
    } catch (err) {
        return res.status(500).json({ message: 'Server Error During Get All Users' });
    }
}

module.exports = { deleteUserProfile, getDashboardData, getAllUsers };

