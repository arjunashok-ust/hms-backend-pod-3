const appointmentModel = require("../models/Appointment");
const employeeModel = require("../models/Employee");
const customerModel = require("../models/Customer");
const userModel = require("../models/User");

//book appointment
exports.createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            doctorEmployeeId,
            date,
            timeSlot,
            status,
            createdByEmployeeId
        } = req.body;

        const patient = await customerModel.findOne({ uhid: patientId });
        if (!patient) {
            return res.status(404).json({ message: "Patient Not Found!" });
        }
        const doctor = await userModel.findOne({ employeeId: doctorEmployeeId, roles: "DOCTOR" });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor Not Found" });
        }
        const creator = await employeeModel.findOne({ employeeId: createdByEmployeeId });
        if (!creator) {
             console.log("creator fault")
            return res.status(404).json({ message: "Creator Employee Not Found!" });
        }

        const appointment = await appointmentModel.create({
            patientId: patientId,
            doctorEmployeeId: doctorEmployeeId,
            date: date,
            timeSlot: timeSlot,
            status: status,
            createdByEmployeeId: createdByEmployeeId,
        });

        return res.status(200).json({
            message: "Appointment Created Sucessfully",
            date: appointment.date,
            status: appointment.status,
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "error During Create Appointment" });
    }
}

//get all appointments
exports.getAllAppointments = async (req, res) => {
    try {
        const appointment = await appointmentModel.find();
        if (!appointment) {
            res.status(404).json({ message: "No Appointments Found" });
        }
        return res.status(200).json(appointment);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "error during getall Appointments" });
    }
}

//get all doctors
exports.getDoctors = async (req, res) => {
    try {
        const doctor = await userModel.find({ roles: "DOCTOR" }).sort({ name: 1 });
        if (!doctor) {
            res.status(404).json({ message: "no doctors found" });
        }
        const doctorEmployeeIds = doctor.map(doc => doc.employeeId);
        const doctorEmployees = await employeeModel.find({employeeId: {$in: doctorEmployeeIds}}).sort({ name: 1 });
        return res.status(200).json(doctorEmployees);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "error during get all doctors" });
    }
}

//to get appointment data
exports.getAppointmentUiData = async(req,res) => {
    try{
        const appointmentCount = await appointmentModel.find().countDocuments();
        if(!appointmentCount){
            return res.status(404).json({ message: "No Appointment Found" });
        }

        const bookedCount = await appointmentModel.find({status: 'BOOKED'}).countDocuments();
        const cancelledCount = await appointmentModel.find({status: 'CANCELLED'}).countDocuments();
        const completedCount = await appointmentModel.find({status: 'COMPLETED'}).countDocuments();

        return res.status(200).json({
            appointmentCount: appointmentCount,
            bookedCount: bookedCount,
            cancelledCount: cancelledCount,
            completedCount: completedCount,
        })
    } catch(err){
        console.error(err);
        return res.status(500).json({ message: "error during get all appointment data" });
    }
}

//delete Appointment
exports.deleteAppointment = async (req,res) => {
    try {
        const appointmentId = req.query.appointmentId;
        const appointment = await appointmentModel.findOne({ appointmentId: appointmentId});
        if(!appointment){
            return res.status(404).json({message: "Appointment Not Found"});
        }
        await appointment.deleteOne();
        return res.status(200).json({message: 'Appointment Deleted Sucessfully'});
    } catch(err){
        console.error(err);
        return res.status(500).json({ message: "error during Delete Appointment" });
    }
}