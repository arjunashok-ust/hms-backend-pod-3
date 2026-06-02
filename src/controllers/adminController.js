const User = require('../models/User');
const Employee = require('../models/Employee');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const jwt = require('jsonwebtoken');

exports.dashboardData = async (req, res) => {
    try {
        const employeeCount = await Employee.countDocuments();
        const activeCount = await User.countDocuments({ status: 'ACTIVE' });
        const pendingApprovalCount = await User.countDocuments({ status: 'PENDING' });
        const pendingVerifyCount = await User.countDocuments({ isVerified: false });
        const patientCount = await Patient.countDocuments();
        const appointmentCount = await Appointment.countDocuments();

        return res.status(200).json({
            message: 'Dashboard Data Fetched',
            employee_Count: employeeCount,
            active_Count: activeCount,
            pendingApprovalCount: pendingApprovalCount,
            pendingVerifyCount: pendingVerifyCount,
            patient_Count: patientCount,
            appointment_Count: appointmentCount,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server Error During Get Dashboard Data' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const { search, role } = req.query;
        let filter = {};
        // SEARCH
        if (search) {
            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    employeeCode: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        // ROLE FILTER
        if (role && role !== "ALL") {
            const users = await User.find({
                role: role
            });
            const employeeIds = users.map(
                user => user.employeeId
            );
            filter.employeeCode = {
                $in: employeeIds
            };
        }
        const employees = await Employee
            .find(filter)
            .sort({ name: 1 });
        return res.status(200).json(employees);
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message:
                "Server Error During Get All Users"
        });
    }
};


exports.deleteUserProfile = async (req, res) => {
    try {

        const EmployeeId = req.body.id;
        const existingUser = await User.findOne({ employeeId: EmployeeId });
        if (!existingUser) {
            return res.status(404).json({ message: 'user not found.' });
        }

        await existingUser.deleteOne();

        const existingEmployee = await Employee.findOneAndDelete({ employeeCode: EmployeeId });
        if (!existingEmployee) {
            return res.status(404).json({ message: 'employee not found.' });
        }

        await existingEmployee.deleteOne();

        return res.status(200).json({
            message: 'account deleted successfully',
            employeeId: EmployeeId,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "server error during delete user profile." });
    }
};


exports.getPendingUsers = async (req, res) => {

    try {

        const {
            search = '',
            role = 'ALL'
        } = req.query;

        let filter = {
            status: "PENDING"
        };

        // EMAIL SEARCH

if (search) {

    filter.$or = [

        {
            email: {
                $regex: search,
                $options: "i"
            }
        },

        {
            employeeId: {
                $regex: search,
                $options: "i"
            }
        }

    ];

}

        // ROLE FILTER

        if (
            role &&
            role !== "ALL"
        ) {

            filter.role = role;

        }

        const users =
            await User.find(filter)
            .select(
                "employeeId email role status isVerified isFirstLogin"
            )
            .sort({
                email: 1
            });

        return res.status(200).json(users);

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            message: "Error fetching pending users"
        });

    }

};

exports.approveUser = async (req, res) => {
  try {
    const { employeeCode } = req.params;
    const user = await User.findOne({ employeeId: employeeCode });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.status = "ACTIVE";
    await user.save();
    return res.status(200).json({ message: "User approved successfully" });
  }catch (err) {
    return res.status(500).json({ message: "Error approving user" });
  }
};


exports.rejectUser = async (req, res) => {

    try {

        const { employeeCode } = req.params;

        const user =
        await User.findOne({
            employeeId: employeeCode
        });

        if (!user) {

            return res.status(404).json({
                message: "User not found"
            });

        }

        user.status = "INACTIVE";

        await user.save();

        const employee =
        await Employee.findOne({
            employeeCode: employeeCode
        });

        if (!employee) {

            return res.status(404).json({
                message: "Employee not found"
            });

        }

        employee.status = "INACTIVE";

        await employee.save();

        return res.status(200).json({

            message:
            "User marked as inactive"

        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({

            message:
            "Error rejecting user"

        });

    }

};



exports.getApprovalStats = async (req,res) => {

    try {

        const pending =
            await User.countDocuments({
                status: "PENDING"
            });

        const verified =
            await User.countDocuments({
                isVerified: true
            });

        const inactive =
            await User.countDocuments({
                status: "INACTIVE"
            });

        const firstLogin =
            await User.countDocuments({
                isFirstLogin: true
            });

        return res.status(200).json({

            pending,
            verified,
            inactive,
            firstLogin

        });

    } catch(err){

        return res.status(500).json({
            message:"Error"
        });

    }

};