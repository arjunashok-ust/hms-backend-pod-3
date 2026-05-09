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
            roles,
            phone,
            department,
            designation,
            status,
            joiningDate,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        }=req.body;

        const existEmployee=await Employee.findOne({email});
        if(existEmployee){
            return res.status(409).json({message:"Email Id Already Registered"});
        }
        console.log(existEmployee);

        const password_hash = await bcrypt.hash(password, 12);

        const profile=await Employee.create({
            email,
            name,
            phone,
            department,
            designation,
            status,
            joiningDate,
            specialization,
            qualification,
            consultationFee,
            availabilitySlots,
        });
     
        const user = await User.create({
            email,
            status,
            password_hash:password_hash,
            
            roles,
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
        const isPasswordValid=await bcrypt.compare(password,user.password_hash);
        if(!isPasswordValid){
            return res.status(401).json({ message: "Invalid email or password" });
        }
        user.last_login=new Date();

        await user.save();

        const token=jwt.sign(
             { email: user.email,
                id:user._id,
                 role: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN });
      
       return res.status(200).json({
             message: "Login successful",
            token,
            user: {id: user._id,email: user.email,role: user.roles},
        });
        
    }catch(err){
         console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
    }
};

//Get Employee Details by EMP-ID

exports.getEmployeeById=async(req,res)=>{
    try{
        const{employeeId}=req.params;

        const existEmployee=await Employee.findOne({employeeId}); 
        console.log(existEmployee);
        if(!existEmployee){
            return res.status(409).json({message:"Employee Doesn't Exist"});
        }
        return res.status(200).json({message:`Employee Found ${existEmployee}`});
    }catch(err){
        console.error("Get Employee Error: ",err);
    return res.status(500).json({ message:"Server error during getting employee"});
    }

}


//Update employee details by EMP-ID

exports.updateEmployeeById=async(req,res)=>{
    try{
        const {
            employeeId,
            name,
            phone,
            specialization,
            consultationFee,
            availabilitySlots
        }=req.body;

        const existEmployee=await Employee.findOne({employeeId});
        if(!existEmployee){
            return res.status(409).json({message:`Employee Not found with id ${employeeId}`});
        }
        if(name){
            existEmployee.name=name;
        }
        if(phone){
            existEmployee.phone=phone;
        }
        if(specialization){
            existEmployee.specialization=specialization;
        }
        if(consultationFee){
            existEmployee.consultationFee=consultationFee;
        }
        if(availabilitySlots){
            existEmployee.availabilitySlots=availabilitySlots;
        }
        existEmployee.save();
        return res.status(201).json({message:`Employee with id ${existEmployee.employeeId} is update successfully`});



    }catch(err){
        console.error("Update Profile Error: ",err);
    return res.status(500).json({ message:"Server error during updating employee"});
    }
}