const Employee = require('../models/employee');
exports.createEmployee = async (req, res) => {
    try{
        const {
        name,   
        phone, 
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
        } = req.body;
        const existingEmployee = await Employee.findOne({ email });
        if(existingEmployee){
            return res.status(400).json({meassage : "Employee with this email already exists"});
        }
        const employee = await Employee.create({
            name,
            phone,
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
        employee = await employee.save();
        res.status(201).json(employee);
    }catch(err){
        console.log("Create Employee Error:", err);
        res.status(500).json({message: "Internal error"});
    }
};