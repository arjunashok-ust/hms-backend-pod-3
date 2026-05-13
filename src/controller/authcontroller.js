const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/User");
const Employee = require("../models/Employee");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-passwordHash")  
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
      availabilitySlots
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    if (role?.includes('Doctor', 'Nurse', 'Pharmacist', 'Lab_tech')) {
            const medicalRegNo = await Employee.findOne({ medicalRegistrationNo: medicalRegistrationNo });
            if (medicalRegNo) {
                return res.status(409).json({ message: 'medical registration no should be unique.' });
            }
        }

    const password_hash = await bcrypt.hash(password, 12);

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

    await User.create({
      email,
      passwordHash: password_hash,
      status,
      roles: role,
      employeeId: savedEmployee._id,
      lastLoginAt: Date.now()
    });

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

        const isValid = await bcrypt.compare(password,existingUser.passwordHash);

        if(!isValid){
            return res.status(404).json({message : " Enter correct password"});
        }

        const token = jwt.sign(
            { userId: existingUser._id, role: existingUser.roles },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        return res.status(200).json({
            message: "Login successfull",
            token,
            user:{
                id : existingUser._id,
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

module.exports = { signup,login ,getProfile };


