const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');

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
            email: user.email,
            status: user.status,
            role: user.role,
            employeeId: user.employeeId,
            isActivated: user.isActivated,
            isVerified: user.isVerified,
            firstLogin: user.firstLogin
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during getUserProfile' });
    }
}


const getNameByEmployeeId = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
        const employee = await Employee.findOne({ employeeCode: employeeId });
        if (!employee) {
            return res.status(404).json({ message: "User not found!" });
        }
        return res.status(200).json(employee.name);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Get Name By EmployeeId' });
    }
}

const getNameByPatientId = async (req, res) => {
    try {
        const patientId = req.query.patientId;
        const patient = await Patient.findOne({ uhid: patientId });
        if (!patient) {
            return res.status(404).json({ message: "User not found!" });
        }
        return res.status(200).json(patient.name);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Get Name By Patient Id' });
    }
}



module.exports = { getUserProfile,getNameByEmployeeId,getNameByPatientId }