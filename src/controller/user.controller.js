const User = require('../models/user.model');

// Get User
const getUserProfile = async (req, res) => {
    try {
        const email = req.body.email;

        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'user not found.' });

        return res.status(200).json({
            message: 'sucessfully obtained user information',
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

// Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        const {
            employeeId,
            data
        } = req.body;

        const existingUser = await Employee.findOne({ employeeCode: employeeId });
        if(!existingUser){
            return res.status(404).json({message: 'user not found!'});
        }
        if(data.employeeCode){
            return res.status(401).json({message: 'employee code cant be edited'});
        }

        // Email Check Here

        // Updation Here

        // Response Here
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during update user profile' });
    }
}

module.exports = { getUserProfile }