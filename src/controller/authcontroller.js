const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/User");
const Employee = require("../models/Employee");
const sendFormSignupMail=require("../utils/sendFormSignupMail");
const sendEmployeeCredentials = require("../utils/mailService");
const sendVerificationMail =
require("../utils/sendVerificationMail");
const formSignUp = async (req, res) => {
    try {
        const {
            email,
            name,
            password,
            role,
            phone,
            department,
            designation,
            status,
            joiningDate,
            specialization,
            medicalRegistrationNo,
            qualification,
            consultationFee,
            availabilitySlots, } = req.body;
 
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({ message: "User already exists" });
        }
 
    
        const password_hash = await bcrypt.hash(password, 12);
        const profile = await Employee.create({
            email,
            name,
            phone,
            department,
            designation,
            status : "Inactive",
            joiningDate,
            medicalRegistrationNo,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        });
        const user = await User.create({

    email,

    status: "Inactive",

    passwordHash: password_hash,

    roles: role,

    employeeId: profile._id,

    isFirstLogin: false,

});
 
        const empId=await profile._id;
        try {
            await sendFormSignupMail("hmsadmin1235@gmail.com", empId);
            console.log("Email sent successfully");
        } catch (mailError) {
            console.error("Mail Service Error:", mailError.message);
        }
 
 
        return res.status(201).json({
            message: "Registered but Admin approval pending",
            employee: profile,
    
        });
 
 
 
 
    } catch (error) {
        console.error("Unable to fetch current user", error);
        return res.status(500).json({ message: error.message });
    }
}

const getProfile = async (req, res) => {
  try {
    // req.user comes from token middleware
    const user = await User.findById(req.user.userId)
      .select("-passwordHash")   // hide password
      .populate("employeeId");
 
    res.status(200).json({
      message: "Profile fetched successfully",
      user
    });
 
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
//Signup
const signup = async (req, res) => {

  try {

    const {
      email,
      password,
      name,
      phone,
      department,
      designation,
      role,
      status,
      joiningDate,
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
    
    } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create employee
    const employee = new Employee({
      email,
      name,
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

    const savedEmployee = await employee.save();

    // Create user
    const user = await User.create({
      email,
      passwordHash: password_hash,
      status,
      roles: role,
      employeeId: savedEmployee._id,
      isVerified:true,
      lastLoginAt: Date.now()
    });

    // Generate token
    // const token = jwt.sign(
    //   {
    //     userId: user._id,
    //     role: user.roles
    //   },
    //   process.env.JWT_SECRET,
    //   {
    //     expiresIn: process.env.JWT_EXPIRES_IN
    //   }
    // );

    console.log("Account created successfully");

    return res.status(201).json({
      success: true,
      message: "Employee Created Successfully",
    
      data: savedEmployee
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
    // }
    // catch (error) {
    //     return res.status(500).json({
    //         success: false,
    //         message: error
    //     });
    // }

const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        const existingUser = await User.findOne({ email });


        if(!existingUser){
           return  res.status(404).json({message: "Email is not registered"});
        }
//         if (!existingUser.isVerified) {

//     return res.status(401).json({

//         message:
//         "Please verify your email first"

//     });

// }
        
    console.log("Stored Hash:", existingUser.passwordHash);

    const isValid = await bcrypt.compare(password, existingUser.passwordHash);

    console.log("Password Match Result:", isValid);

        if(!isValid){
            return res.status(404).json({message : " Enter correct password"});
        }

        const token = jwt.sign(
            { userId: existingUser._id, role: existingUser.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
 console.log("USER FROM DB 👉", existingUser);
        
return res.status(200).json({
            message: "Login successfull",
            token,
            user:{
                id : existingUser._id,
                 name: existingUser.name,
                email : existingUser.email,
                role: existingUser.roles,
                
            }
        });
       

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};
const deleteEmployee = async(req,res) => {
    try {
        const { employeeCode } = req.params;
        if(req.user.role!=="Admin"){
            return res.status(403).json({message: "Only admin has the access to delete"});

        } 
        const employee = await Employee.findOne({employeeCode});
        if(!employee){
            return res.status(404).json({message:"Employee not found"});
        }
        await User.deleteOne({ employeeId : employeeCode});
        await Employee.deleteOne({ employeeCode});
        return res.status(200).json({message: "Deleted Successfully"});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error: " Error during delete"});
        
    }
};
const updateUser = async (req, res) => {
    try {

        const {
            name,
            phone,
            department,
            specialization,
            qualification
        } = req.body;

        const user = await User.findById(req.user.userId).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const employee = await Employee.findOne({
            email: user.email
        });


        if (name) {
            employee.name = name;
        }
        if (phone) {
            employee.phone = phone
        }
        if (department) {
            employee.department = department
        }
        if (specialization) {
            employee.specialization = specialization
        }
        if (qualification) {
            employee.qualification = qualification
        }

        await employee.save();

        res.status(200).json({
            message: "Updation successful",
            user: {
                name: employee.name,
                phone: employee.phone,
                department: employee.department,
                specialization: employee.specialization,
                qualification: employee.qualification
            }
        });

    } catch (error) {
        console.error("Error in updating", error);
        res.status(500).json({ message: error.message });
    }
};

//verify email

const verifyMail = async (req, res) => {

  try {

    const {
      email,
      verification_token
    } = req.query;

    const user = await User.findOne({ email });

    if (!user) {

      return res.status(404).json({
        message: 'User Not Found'
      });

    }

    if (
      verification_token !==
      user.verification_token
    ) {

      return res.status(400).json({
        message: 'Invalid Verification Token'
      });

    }

    user.isVerified = true;

    user.verification_token = null;

    await user.save();

    return res.status(200).json({

      message: "Email Verified Successfully"

    });

  }

  catch (err) {

    return res.status(500).json({

      message: 'Server Error During Email Verification'

    });

  }

};
// Admin Signup

// Admin Signup

const signUpAdmin = async (req, res) => {

    try {

        const {

            email,

            name,

            role,

            phone,

            department,

            designation,

            status,

            joiningDate,

            specialization,

            medicalRegistrationNo,

            qualification,

            consultationFee,

            availabilitySlots

        } = req.body;

        // Check existing user

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already registered"

            });

        }

        // Check Medical Registration Number

        if (

            role === "Doctor" ||

            role === "Nurse" ||

            role === "Lab_tech" ||

            role === "Pharmicist"

        ) {

            const medicalRegNo =
                await Employee.findOne({

                    medicalRegistrationNo

                });

            if (medicalRegNo) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Medical Registration Number already exists"

                });

            }

        }

        // Generate Temporary Password

        const tempPassword =
            crypto.randomBytes(8).toString("hex");

        console.log(
            "Temporary Password:",
            tempPassword
        );

        // Hash Password

        const password_hash =
            await bcrypt.hash(
                tempPassword,
                12
            );

        // Create Employee Profile

        const profile =
            await Employee.create({

                email,

                name,

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

        // Generate Verification Token

        const verification_token =
            crypto.randomBytes(32).toString("hex");

        const verification_expiry =
            Date.now() +
            24 * 60 * 60 * 1000;

        // Create User

        const user =
            await User.create({

                email,

                passwordHash:
                    password_hash,

                status,

                roles: role,

                employeeId:
                    profile._id,

                verification_token,

                verification_expiry,

                isVerified: false,

                isFirstLogin: true

            });

        // Send Employee Credentials Mail

        await sendEmployeeCredentials(

            user.email,

            tempPassword

        );

        // Create Verification Link

        const verificationLink =

`http://localhost:3000/api/auth/verify-email?email=${user.email}&verification_token=${verification_token}`;

        // Send Verification Mail

        await sendVerificationMail(

            user.email,

            profile.name,

            verificationLink

        );

        console.log(

            `Verification Mail Sent To ${user.email}`

        );

        return res.status(201).json({

            success: true,

            message:
                "Employee Created Successfully",

            email: user.email

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message:
                "Server Error During Signup"

        });

    }

};
 
module.exports = { signup,login ,getProfile, deleteEmployee, updateUser, formSignUp, verifyMail, signUpAdmin};


