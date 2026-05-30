const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const employeeModel = require("../models/Employee");
const userModel = require("../models/User");
const mail = require("../utils/mailService.util");
const { error } = require("console");

//SIGNUP employee
exports.employeeSignup = async (req, res) => {
    try {
        const {
            name, email, password, department, designation,
            status, joiningDate, medicalRegistrationNo,
            specialization, qualification, consultationFee,
            availabilitySlots, roles, phone
        } = req.body;

        const existingUser = await employeeModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "The employee is already registered" });
        }

        if ( roles=="DOCTOR" || roles=="PHARMACIST" || roles=="NURSE" || roles=="LAB_TECH" ) {
            const medicRegNo = await employeeModel.findOne({ medicalRegistrationNo: medicalRegistrationNo });
            if (medicRegNo) {
                return res.status(409).json({ message: 'medical registration no should be unique.' });
            }
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpiry = Date.now() + 60 * 60 * 24*1000;

        const employee = await employeeModel.create({
            name,
            email,
            phone,
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
        const user = await userModel.create({
            email,
            passwordHash,
            status,
            roles,
            employeeId: employee.employeeId,
            verificationToken,
            verificationExpiry
        });

        //for user mail verification
        await mail.sendEmail({
            to: user.email,
            subject: "User mail verification by HMS",
            html:`<h1>Hospital Management System</h1><br>
            <p>Thank you ${employee.name} for successfully registering with HMS,
             You can now verify your email by clicking the below button.</p><br>
            <a href="http://localhost:8080/hms/verifyEmail?email=${user.email}&verificationToken=${user.verificationToken}">
            <input type="Button" value="Verify">
            </a>`
        });

        //mail for admin verification
        await mail.sendEmail({
            to: process.env.ADMIN_EMAIL,
            subject: "User Approval for HMS",
            html:`<h1>Hospital Management System<h1><br>
            <p>A new user ${employee.name} has registered on HMS and is awaiting your approval.</p>
            <p>User Details: <br>
            Name: ${employee.name}<br>
            Email: ${employee.email}</p>`
        })
 
        return res.status(201).json({
            message: "User Registered Successfully",
            employee: employee,
            user: user
        });

    } catch (err) {
        console.log("Signup error: ", err);
        res.status(500).json({ message: err.message });
    }
}

//verify email
exports.verifyEmail = async( req, res ) => {
    try {
        const { email, verificationToken } = req.query;
        const user = await userModel.findOne({ email });
        if(!user) {
            return res.status(404).json({message: "Unable to find user"});
        }

        if(verificationToken != user.verificationToken) {
            return res.status(400).json({message: "Verification Token is invalid"});
        }
        user.isVerified = true;
        await user.save();
        return res.status(200).json({message: "Email verification successfull"});
    } catch(err) {
        return res.status(500).json({message: "Error during email verification"});
    }
}

//login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        const passwordMatch = Boolean(await bcrypt.compare(password, user.passwordHash));
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if(!user.isVerified) {
            return res.status(400).json({message:"please verify your Email"});
        }

        if(!user.isActivated) {
            return res.status(400).json({message:"Your account is yet to be activated"});
        }

        user.lastLoginAt = Date.now();
        await user.save();
        const token = jwt.sign(
            { id: user._id, role: user.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        const employee = await employeeModel.findOne({ email });
        res.status(200).json({
            message: "Login successful",
            token,
            employee,
            role: user.roles,
            verificationToken: user.verificationToken
        });
    } catch (err) {
        console.log("Login error: ", err);
        res.status(500).json({ message: err.message });
    }
}

//reset password
exports.resetPassword = async( req, res ) => {
    try {
        const { oldPassword, newPassword, employeeId } = req.body;
        const existingUser = await userModel.findOne({ employeeId });
        if(!existingUser) {
            return res.status(404).json({message: "User not found"});
        }

        const oldPasswordHash = existingUser.passwordHash;
        const valid = await bcrypt.compare(oldPassword, oldPasswordHash);
        if(!valid) {
            return res.status(400).json({message: "The password you have given is incorrect"});
        }
        if(oldPassword == newPassword) {
            return res.status(400).json({message: "Please input different password from old one"});
        }

        const passwordHash = await bcrypt.hash(newPassword,12);
        existingUser.passwordHash = passwordHash;
        await existingUser.save();
        return res.status(200).json({message: "Successfully reset the password"});
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Error during password reset"});
    }
}

//refresh token
exports.refresh = async( req, res ) => {
    try {
        const employeeId = req.body.employeeId;
        const existingUser = await userModel.findOne({ employeeId });
        if(!existingUser) {
            return res.status(404).json({message: "User not found"});
        }

        const newToken = await jwt.sign(
            {email: existingUser.email, roles: existingUser.roles},
            process.env.JWT_SECRET,
            {expiresIn: process.env.JWT_EXPIRES_IN}
        );

        return res.status(200).json({message: "New token is generated",
            token: newToken,
        })
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "Error during refresh token"});
    }
}

//first time password set
exports.setPassword = async( req, res ) => {
    try {
        const { employeeId, password } = req.body;
        const user = await userModel.findOne({ employeeId });
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const status = user.firstLogin;
        if(!status) {
            return res.status(403).json({message: "Password can be set only first time"});
        }

        const passwordHash = await bcrypt.hash(password,12);
        user.passwordHash = passwordHash;
        user.firstLogin = false;
        await user.save();
        return res.status(200).json({message: "password set successfully"});
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "Error during setpassword"});
    }
}