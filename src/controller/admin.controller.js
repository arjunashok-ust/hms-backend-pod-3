const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const jwt = require('jsonwebtoken');

const deleteUserProfile = async (req, res) => {
    try {
        if (!req.user.roles?.includes('admin')) {
            return res.status(401).json({ message: 'not authorized to do this operation.' });
        }
        const EmployeeId = req.body.id;
        const existingUser = await User.findOne({ employeeId: EmployeeId });
        if (!existingUser) {
            return res.status(404).json({ message: 'user not found.' });
        }
        if (existingUser.roles.includes('admin')) {
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

module.exports = { deleteUserProfile };

