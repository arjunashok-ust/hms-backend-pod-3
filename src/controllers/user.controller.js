const userModel = require("../models/User");
const employeeModel = require("../models/Employee");
const customerModel = require("../models/Customer");

//get user profile
exports.profile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const employee = await employeeModel.findOne({employeeId:user.employeeId});
        res.status(200).json({ employee });
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).json({ message: err.message });
    }
}

//get employee name
exports.getNameByEmployeeId = async(req, res) => {
    try {
        const employeeId = req.query.employeeId;
        const employee = await employeeModel.findOne({employeeId: employeeId});
        if(!employee) {
            return res.status(404).json({message: "employee not found"});
        }
        return res.status(200).json(employee.name);
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "error during getNameByEmployeeId"});
    }
}

// get name by patient id
exports.getNameByCustomerId = async(req, res) => {
    try {
        const customerId = req.query.customerId;
        const customer = await customerModel.findOne({uhid: customerId});
        if(!customer) {
            return res.status(404).json({message: "Patient/Customer not found"});
        }
        return res.status(200).json(customer.name);
    } catch(err) {
        console.error(err);
        return res.status(500).json({message: "error during getNameByCustomerId"});
    }
}

//updateEmployee
exports.updateEmployee = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { name, email, phone, consultationFee, availabilitySlots } = req.body;
        const employee = await employeeModel.findOneAndUpdate({ employeeId: user.employeeId },
            { name, email, phone, consultationFee, availabilitySlots },
            { returnDocument: "after" }
        );
        await userModel.findOneAndUpdate({ employeeId: user.employeeId },
            { name, email, phone, consultationFee, availabilitySlots },
            { returnDocument: "after" }
        );
        res.status(200).json({ message: "Updates successfull" , employee });
    } catch (err) {
        console.log("updateUSer error: ", err);
        res.status(500).json({ message: err.message });
    }
}

// new patient
exports.createPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact,
            status,
        } = req.body;

        const existingPatient = await customerModel.findOne({ email: email });

        if (existingPatient) {
            return res.status(401).json({ message: 'Email is already registered.' });
        }

        await customerModel.create({
            name: name,
            phone: phone,
            email: email,
            gender: gender,
            dob: dob,
            address: address,
            emergencyContact: emergencyContact,
            status: status
        });

        return res.status(200).json({ message: "Patient created sucessfully." });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Error During Create Patient" });
    }
}

exports.getPatients = async (req, res) => {
    try {
        const patients = await customerModel.find();
        if (!patients) {
            return res.status(404).json({ message: 'No Patients Found.' });
        }
        return res.status(200).json(patients);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error During Get Patients' });
    }
}

exports.deletePatient = async (req,res) => {
    try{
        const patientId = req.body.patientId;

        const patient = await customerModel.findOne({ uhid: patientId});
        if(!patient){
            return res.status(404).json({ message: 'Patient not found' });
        }
        
        await patient.deleteOne();

        return res.status(200).json({message: 'Patient Deleted Sucessfully'});
    }
    catch(err) {
        console.error(err);
        return res.status(500).json({ message: 'Error During Delete Patient' });
    }
}
