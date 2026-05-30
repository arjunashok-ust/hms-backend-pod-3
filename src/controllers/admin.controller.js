const employeeModel = require("../models/Employee");
const userModel = require("../models/User");
const customerModel = require("../models/Customer");
const appointmentModel = require("../models/Appointment");
const departmentModel = require("../models/Department");
const jwt = require("jsonwebtoken");

//Delete only by admin
exports.adminDelete = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.roles !== "ADMIN") {
            return res.status(404).json({ message: "Only admin is able to delete users" });
        }
        const email = req.body;
        await userModel.findOneAndDelete(email);
        await employeeModel.findOneAndDelete(email);
        res.status(200).json({ message: "Deleted user successfully" });
    } catch (err) {
        console.log("adminDelete error: ", err);
        res.status(500).json({ message: err.message });
    }
}

//dashboard
exports.getDashboardData = async(req, res) => {
    try {
        const employeeCount = await employeeModel.countDocuments();
        const customerCount = await customerModel.countDocuments();
        const appointmentCount = await appointmentModel.countDocuments();
        const departmentCount = await departmentModel.countDocuments();
        const pendingApprovalCount = await userModel.countDocuments({isActivated: false});
        const pendingVerifyCount = await userModel.countDocuments({isVerified: false});
        const activeCount = await employeeModel.countDocuments({status: "ACTIVE"});

        return res.status(200).json({message: "Dashboard data fetched",
            employeeCount: employeeCount,
            customerCount: customerCount,
            departmentCount: departmentCount,
            appointmentCount: appointmentCount,
            pendingApprovalCount: pendingApprovalCount,
            pendingVerifyCount: pendingVerifyCount,
            activeCount: activeCount
        })
    } catch(err) {
        console.error(err)
        return res.status(500).json({message: "error during fetching dashboard data"});
    }
}

//available employees
exports.getAllEmployees = async(req, res) => {
    try {
        const employee = await employeeModel.find();
        return res.status(200).json(employee);
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "error during get all employees"});
    }
}

//available users
exports.getAllUsers = async(req, res) => {
    try {
        const user = await userModel.find();
        return res.status(200).json(user);
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "error during get all users"});
    }
}

//signup by admin
exports.adminSignup = async (req, res) => {
    try {
        const {
            email,
            phone,
            name,
            password,
            roles,
            department,
            designation,
            status,
            joiningDate,
            specialization,
            medicalRegistrationNo,
            qualification,
            consultationFee,
            availabilitySlots, } = req.body;
 
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
 
        const existingEmployee = await employeeModel.findOne({ email });
        if (existingEmployee) {
            return res.status(409).json({ message: "User already exists" });
        }
 
        if ( roles=="DOCTOR" || roles=="PHARMACIST" || roles=="NURSE" || roles=="LAB_TECH" ) {
            const medicRegNo = await employeeModel.findOne({ medicalRegistrationNo: medicalRegistrationNo });
            if (medicRegNo) {
                return res.status(409).json({ message: 'medical registration no should be unique.' });
            }
        }

        const tempPassword = crypto.randomBytes(16).toString('hex');
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpiry = Date.now() + 60 * 60 * 24*1000;
        const password_hash = await bcrypt.hash(tempPassword, 12);

        const employee = await employeeModel.create({
            email,
            name,
            phone,
            department,
            designation,
            status:"INACTIVE",
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        });

        const user = await userModel.create({
            email,
            status:"INACTIVE",
            passwordHash: password_hash,
            roles,
            employeeId: employee.employeeId,
            verificationToken,
            verificationExpiry
        });
 
        //user mail for temporary password
        await mail.sendEmail({
            to: user.email,
            subject: "HMS system | Temporary password reset",
            html:`<h1>Hospital Management System</h1><br>
            <p>Your account has been registered, Please use the following credentials
            for login and please change password <br>
            Email: ${user.email}</br>
            password: ${tempPassword}</p>`
        });

        //user email verification
        await mail.sendEmail({
            to: user.email,
            subject:"User mail verification",
            html:`<h1>Hospital Management System</h1><br>
            <p>Thank you ${employee.name} for successfully registering with HMS,
             You can now verify your email by clicking the below button.</p><br>
            <a href="http://localhost:8080/hms/verifyEmail?email=${user.email}&verificationToken=${user.verificationToken}">
            <input type="Button" value="Verify">
            </a>`
        })
 
        return res.status(201).json({
            message: `Registered user ${employee.name} Successfully`,
            employee: employee,
            user: user
        });
 
 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message:"Error during adminSignUp"});
    }
}

//Accept user approval
exports.acceptApproval = async(req, res) => {
    try {
        const employeeId = req.body.employeeId;
        const user = await userModel.findOne({employeeId: employeeId});
        if(!user) {
            return res.status(404).json({message: "Employee Not found"});
        }
        user.isActivated = true;
        user.status = "ACTIVE";
        user.save();

        return res.status(200).json({message: "Employee is Approved by admin"});
    } catch(err) {
        console.error(err);
        return res.status(500).json({ message: 'error during Approve user' });
    }
}

//reject user Approval
exports.rejectApproval = async (req, res) => {
    try {
        const employeeId = req.body.employeeId;
        const user = await userModel.findOne({ employeeId: employeeId });
        if (!user) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        user.isActivated = false;
        user.status = 'INACTIVE';
        user.save();

        return res.status(200).json({
            message: 'Account activation application rejected'});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'error during Approve user' });
    }
}