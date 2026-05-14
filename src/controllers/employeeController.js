const Employee=require('../models/Employee');
const User=require('../models/User');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");

exports.signup=async(req,res)=>{
    try{
        const {
            email, 
            password,
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
            availabilitySlots,
        }=req.body;

        if (role === "doctor" || role === "lab_Tech"|| role === "nurse"|| role === "pharmacist") {

            if (!medicalRegistrationNo) {
                return res.status(400).json({success: false, message: "Medical Registration Number is required"});
            }

            const existingMedicalRegistrationNo = await Employee.findOne({ medicalRegistrationNo});

            if (existingMedicalRegistrationNo) {
                return res.status(400).json({
                    success: false,
                    message: "Medical Registration Number already exists,provide a different one",
                });
            }
        }

        const existEmployee=await Employee.findOne({email});
        if(existEmployee){
            return res.status(409).json({message:"Email Id Already Registered"});
        }


        const password_hash = await bcrypt.hash(password, 12);

        const profile=await Employee.create({
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
            availabilitySlots,

        });
     
        const user = await User.create({
            email,
            status,
            password_hash:password_hash,
            role,
            employeeId: profile.employeeId,
        }); 
        res.status(201).json({message:"Employee Registered Successfully",employee:profile,user:user});


    }catch(err){
         console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
    }
}

//Login For Emoloyee

exports.login=async(req,res)=>{
    try{
        const{
            email,
            password,
        }=req.body;
        const user=await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User Not Found"});
        }

        const isPasswordValid=Boolean(await bcrypt.compare(password,user.password_hash));

        if(!isPasswordValid){
            return res.status(401).json({ message: "Invalid email or password" });
        }
        user.last_login=new Date();

        await user.save();

        const token=jwt.sign(
             { email: user.email,
                id:user._id,
                role: user.role },
                process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN });
      
       return res.status(200).json({
             message: "Login successful",
            token,
            user: {id: user._id,email: user.email,role: user.role},
        });
        
    }catch(err){
         console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
    }
};


//ME Function
exports.currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
 
        res.status(200).json({
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt
            }
        })
 
    } catch (error) {
        console.error("Unable to fetch current user", error);
        res.status(500).json({ message: error.message });
    }
};
 
 
 

