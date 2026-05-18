const User = require('../models/user.model');
const Employee = require('../models/employee.model');

// Get User
const getUserProfile = async (req, res) => {
    try {
        const email = req.query.email;

        const user = await User.findOne({ email });
        const employee = await Employee.findOne({ email });

        if (!user) return res.status(404).json({ message: 'user not found.' });

        return res.status(200).json({
            message: 'sucessfully obtained user information',
            name: employee.name,
            designation: employee.designation,
            email: user.email,
            employeeId: user.employeeId,
            status: user.status,
            roles: user.roles,
            lastLoginAt: user.lastLoginAt
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during getUserProfile' });
    }
}

module.exports = { getUserProfile }