const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const User = require("../models/User");
const Employee = require("../models/Employee");

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
    // try {
        const {
            email,
            password,
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
        } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }
        const password_hash = await bcrypt.hash(password, 12);

        const employee = new Employee();
        employee.email = email;
        employee.name = name;
        employee.phone = phone;
        employee.department = department;
        employee.designation = designation;
        employee.status = status;
        employee.joiningDate = joiningDate;
        employee.medicalRegistrationNo = medicalRegistrationNo;
        employee.specialization = specialization;
        employee.qualification = qualification;
        employee.consultationFee = consultationFee;
        employee.availabilitySlots = availabilitySlots;

        const savedEmployee = await employee.save();
        
        const user = await User.create({
            email,
           passwordHash: password_hash,
           status,
           roles : designation,
           lastLoginAt : Date.now(),
        });

        user.employeeId = savedEmployee.employeeCode;
        user.save();
           const token = jwt.sign(
  { userId: user._id, role: user.roles },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

        //const employee=await Employee.create(req.body);

        console.log("account created sucessfully.")
        res.status(201).json({
            success: true,
            message: "Employee Created Successfully",
            token,
            data: savedEmployee
        });
    // }
    // catch (error) {
    //     return res.status(500).json({
    //         success: false,
    //         message: error
    //     });
    // }
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
            token
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


module.exports = { signup,login ,getProfile};


