const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const mail = require('../utils/mail.utils')

const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');
const medicalRecord = require('../models/medicalRecord.model');
const Bill = require('../models/bill.model');
const Payment = require('../models/payment.model');

const Role = require('../models/role.model');
const Department = require('../models/department.model');
const Specialization = require('../models/specialization.model');

// SignUp
const signUp = async (req, res) => {
    try {
        const {
            name,
            role,
            email,
            password,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        } = req.body;

        const existingUser = await Employee.findOne({ email });

        if (existingUser) {
            // 409 conflict
            return res.status(409).json({ message: 'email is already registered.' });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        if (role == 'Doctor') {
            const medicalRegNo = await Employee.findOne({ medicalRegistrationNo: medicalRegistrationNo });
            if (medicalRegNo) {
                return res.status(409).json({ message: 'medical registration no should be unique.' });
            }
        }

        const profile = await Employee.create({
            name,
            email,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        });

        const verification_token = crypto.randomBytes(32).toString("hex");
        const verification_expiry = Date.now() + 60 * 60 * 24;

        const user = await User.create({
            email: email,
            passwordHash: passwordHash,
            status: status,
            role: role,
            employeeId: profile.employeeCode,
            verification_token: verification_token,
            verification_expiry: verification_expiry,
            isActivated: false,
            isVerified: false,
            firstLogin: false,
        });

        // user email verification
        await mail.sendMail({
            to: user.email,
            subject: 'HMS System | User Email Verification',
            html: `
            <h1>Hospital Management System</h1><br>
            <p>Thank you ${profile.name} for registering with <b>hms</b>,You can now verify your email by clicking the button below.</p><br>
            <a href="http://localhost:8080/auth/verify-email?email=${user.email}&verification_token=${user.verification_token}">
            <input type="Button" value="Verify">
            </a>
            `
        });

        // email for admin 
        await mail.sendMail({
            to: process.env.ADMIN_MAIL,
            subject: 'HMS Notification | User Approval',
            html: `
            <h1>Hospital Management System</h1><br>
            <p> A new user has registered on the <b>HMS</b> platform and is awaiting your approval.</p>
            <p>
            <b>User Details:</b><br>
            Name: ${profile.name}<br>
            Email: ${profile.email}<br>
            </p>
            `
        });

        console.log(`verification token sent to ${user.email}`)
        console.log("account created.");
        // 201 created
        return res.status(201).json({
            message: "account created sucessfully.",
            email: email,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during signup' });
    }
}

// SignUp Admin
const signUpAdmin = async (req, res) => {
    try {
        const {
            name,
            role,
            email,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        } = req.body;

        const existingUser = await Employee.findOne({ email });

        if (existingUser) {
            // 409 conflict
            return res.status(409).json({ message: 'email is already registered.' });
        }

        if (role.includes('Doctor', 'Nurse', 'Pharmacist', 'Lab_Tech')) {
            const medicalRegNo = await Employee.findOne({ medicalRegistrationNo: medicalRegistrationNo });
            if (medicalRegNo) {
                return res.status(409).json({ message: 'medical registration no should be unique.' });
            }
        }

        const tempPassword = crypto.randomBytes(12).toString('hex');
        console.log(tempPassword);
        const passwordHash = await bcrypt.hash(tempPassword,12);

        const profile = await Employee.create({
            name,
            email,
            department,
            designation,
            status,
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots
        });

        const verification_token = crypto.randomBytes(32).toString("hex");
        const verification_expiry = Date.now() + 60 * 60 * 24;

        const user = await User.create({
            email: email,
            passwordHash: passwordHash,
            status: status,
            role: role,
            employeeId: profile.employeeCode,
            verification_token: verification_token,
            verification_expiry: verification_expiry,
            isActivated: true,
            isVerified: false,
            firstLogin: true
        });

        // user credentials
        await mail.sendMail({
            to: user.email,
            subject: 'HMS System | Employee Credentials',
            html: `
            <h1>Hospital Management System</h1><br>
            <p> Your profile has been registered,you can now login using the credentials below.<br>
            Email : <b>${user.email}</b><br>
            Password : <b>${tempPassword}</b><br>
            </p>
            `
        });

        // user email verification
        await mail.sendMail({
            to: user.email,
            subject: 'HMS System | User Email Verification',
            html: `
            <h1>Hospital Management System</h1><br>
            <p>Thank you ${profile.name} for registering with <b>hms</b>,You can now verify your email by clicking the button below.</p><br>
           <a href="http://localhost:8080/auth/verify-email?email=${user.email}&verification_token=${user.verification_token}">
            <input type="Button" value="Verify">
            </a>
            `
        });
        console.log(`verification token sent to ${user.email}`)

        console.log("account created.");
        // 201 created
        return res.status(201).json({
            message: "account created sucessfully.",
            email: email,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during signup' });
    }
}

// Login
const login = async (req, res) => {
    try {
        const {
            email,
            password,
        } = req.body;

        console.log(req.body);

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({ message: 'invalid credentials.' })
        }

        const isMatch = await bcrypt.compare(password, existingUser.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: 'invalid credentials.' });
        }

        if(!existingUser.isVerified){
            return res.status(400).json({message: 'User Email Is Not Verified.'});
        }

        if(!existingUser.isActivated){
            return res.status(400).json({message: 'Your Account Is Not Activated'});
        }


        existingUser.lastLoginAt = Date.now();
        await existingUser.save();


        const token = jwt.sign(
            {
                email: existingUser.email,
                role: existingUser.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN })

        console.log("login sucessfull");
        return res.status(200).json({
            message: 'login sucessfull',
            email: existingUser.email,
            token: token,
            firstLogin: existingUser.firstLogin
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'server error during login' });
    }
}

// reset password
const resetPassword = async(req,res) => {
    try{
        const {
            prevPassword,
            newPassword,
            employeeId,
        } = req.body;

        const existingUser = await User.findOne({ employeeId });

        if(!existingUser){
            return res.status(404).json({message: "User Not Found."})
        }

        const prevPasswordHash = existingUser.passwordHash;
        const valid = await bcrypt.compare(prevPassword,prevPasswordHash);
        console.log(valid);
        if(!valid){
          return res.status(400).json({message: "Previous Password is Incorrect!"});  
        }

        if(prevPassword == newPassword){
            return res.status(400).json({message: "New password must be different from old password"});
        }

        const passwordHash = await bcrypt.hash(newPassword,12);

        existingUser.passwordHash = passwordHash;
        await existingUser.save();

        return res.status(200).json({message: "Password Reset Sucessfull!"});
    } catch(err){
        return res.status(500).json({message: 'Server Error During Reset Password'});
    }
}

// refresh
const refresh = async (req,res) => {
    try{
        const employeeId = req.body.employeeId;

        const existingUser = await User.findOne({ employeeId });

        if(!existingUser){
            return res.status(404).json({message: "User Not Found."});
        }

        const newToken = await jwt.sign(
            {email: existingUser.email,roles: existingUser.roles},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );

        return res.status(200).json({
            message: 'New token is generated.',
            token: newToken,
        });
    }
    catch(err){
        return res.status(500).json({message: 'Server Error During Refresh Token'})
    }
}

// set password for first time users
const setPassword = async (req,res) => {
    try{
        const { email,password } = req.body;

        const user = await User.findOne({ email: email });

        if(!user){
            return res.status(404).json({message: 'User Not Found!'});
        }

        const status = user.firstLogin;

        if(!status){
            return res.status(403).json({message: "Set password is only allowed for first-time users"});
        }

        const passwordHash = await bcrypt.hash(password,12);
        user.passwordHash = passwordHash;
        user.firstLogin = false;
        await user.save();

        return res.status(200).json({message: 'Password Is Set'});
    }
    catch(err){
        return res.status(500).json({message: 'Server Error During Set Password'});
    }
}

// verify mail
const verifyMail = async (req,res) => {
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
        user.save();

        return res.status(200).json({message: "Email Verified Successfully"});
    } catch(err){
        return res.status(500).json({message: 'Server Error During Forgot Password'});
    }
}




module.exports = { signUp, login, signUpAdmin, resetPassword ,refresh , setPassword, verifyMail };

