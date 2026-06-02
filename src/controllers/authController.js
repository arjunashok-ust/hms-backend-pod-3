const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/User");
const Employee = require("../models/Employee");
const sendFormSignupMail =require("../utils/formSignupMail");
const sendEmployeeCredentials = require("../utils/sendCredtionals");
const sendVerificationMail =require("../utils/verify");

//signup by admin
exports.signup = async (req, res) => {
    try {
        const {
            email,
            name,
            role,
            phone,
            department,
            designation,
            joiningDate,
            specialization,
            medicalRegistrationNo,
            qualification,
            consultationFee,
            availabilitySlots,
        } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(409).json({ message: "Employee already registered." });
        }

        const medicalRoles = ["DOCTOR", "NURSE", "PHARMACIST", "LAB_TECH"];

        if (medicalRoles.includes(role)) {

            if (!medicalRegistrationNo) {
                return res.status(400).json({ success: false, message: "Medical Registration Number is required" });
            }

            const existingMedicalRegistrationNo = await Employee.findOne({ medicalRegistrationNo });

            if (existingMedicalRegistrationNo) {
                return res.status(400).json({
                    success: false,
                    message: "Medical Registration Number already exists,provide a different one",
                });
            }
        }
 
        //Temp password
        const tempPassword = crypto.randomBytes(4).toString("hex");
 
        // hash password
        const password_hash = await bcrypt.hash(tempPassword, 12);
 
        const employee = await Employee.create({
            email,
            name,
            phone,
            department,
            designation,
            status: "ACTIVE",
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        });

        const verification_token = crypto.randomBytes(32).toString("hex");
        const verification_expiry =  new Date(
                Date.now() + 24 * 60 * 60 * 1000
            );
 
        const user = await User.create({
            email,
            status:"ACTIVE",
            passwordHash:password_hash,
            role,
            employeeId: employee.employeeCode,
            isFirstLogin: true,
            verification_token,
            verification_expiry,
            isVerified: false,
        });
 
        // send temp password mail
        try {
            await sendEmployeeCredentials(email, tempPassword);
            console.log("Credentials mail sent");
        } catch (mailError) {
            console.error("Credentials mail failed:", mailError.message);
        }
 
        console.log("Temporary Password:", tempPassword);
 

    // user email verification
        try {
            await sendVerificationMail(user.email, employee.name, verification_token);
            console.log("Verification mail sent");
        } catch (mailError) {
            console.error("Verification mail failed:", mailError.message);
        }
        return res.status(201).json({
            message:"Employee created successfully",
            employee,
            user
        });

    } catch (err) {
        console.error("Signup error:", err);
 
        return res.status(500).json({
            message: "Server error during signup",
        });
    }
};
 
//Form Based SignUp
exports.formSignUp = async (req, res) => {
    try {
        const {
            email,
            name,
            password,
            role,
            phone,
            department,
            designation,
            joiningDate,
            specialization,
            medicalRegistrationNo,
            qualification,
            consultationFee,
            availabilitySlots, } = req.body;
 
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ message: "User already exist" });
        }
 
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(401).json({ message: "User already exist" });
        }
 
        const password_hash = await bcrypt.hash(password, 12);

        const employee = await Employee.create({
            email,
            name,
            phone,
            department,
            designation,
            status:"PENDING",
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        });
        const user = await User.create({
            email,
            status:"PENDING",
            passwordHash: password_hash,
            role,
            employeeId: employee.employeeCode,
            isFirstLogin: false,
        });
 
        try {
            await sendFormSignupMail("hmsadmin1235@gmail.com", employee.employeeCode);
            console.log("Admin notification mail sent");
        } catch (mailError) {
            console.error("Admin notification mail failed:", mailError.message);
        }
 
        return res.status(201).json({
            message: "Registration submitted. Admin approval pending",
            employee,
            user
        });
 
    } catch (error) {
        console.error("Signnup error:", error);
        res.status(500).json({ message: "Server error during signup" });
    }
}

//login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.status != "ACTIVE") {
            return res.status(403).json({
                message: "Account not active"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email"
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        user.lastLoginAt = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user.employeeId, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.employeeId,
                email: user.email,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                lastLoginAt: user.lastLoginAt
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
};


// RESET PASSWORD
// authController.js
exports.resetPassword = async (req, res) => {
    try {
        const { prevPassword, newPassword, employeeId } = req.body;

        const user = await User.findOne({ employeeId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(prevPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Previous password is incorrect" });
        }

        // SAME PASSWORD CHECK — this stays in the controller, it's business logic
        // not a format check, so express-validator isn't the right place for it
        const isSame = await bcrypt.compare(newPassword, user.passwordHash);
        if (isSame) {
            return res.status(400).json({ message: "New password must be different from current" });
        }

        // LENGTH CHECK REMOVED FROM HERE — now handled by express-validator above

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.isFirstLogin = false;
        await user.save();

        return res.status(200).json({ message: "Password reset successful" });

    } catch (err) {
        console.error("Reset password error:", err);
        return res.status(500).json({ message: "Server error during reset password" });
    }
};


// verify mail
exports.verifyMail = async (req,res) => {
    try{
        const {
            email,
            verification_token
        } = req.query;
 
        const user = await User.findOne({ email });
 
        if(!user){
             return res.status(404).json({message: 'User Not Found!'});  
        }
 
        if(verification_token!=user.verification_token){
            return res.status(400).json({message: 'Verification Token Is Invalid'});  
        }
 
        user.isVerified=true;
        user.verification_token = null;
        user.verification_expiry = null;

        await user.save();
 
        return res.status(200).json({message: "Email Verified Successfully"});
    } catch(err){
        return res.status(500).json({message: 'Server Error During Forgot Password'});
    }
};