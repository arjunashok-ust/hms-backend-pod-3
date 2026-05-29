const Appointment = require('../models/appointment.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');

const createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            doctorEmployeeId,
            date,
            timeSlot,
            status,
            createdByEmployeeId
        } = req.body;

        const patient = await Patient.findOne({ uhid: patientId });
        if (!patient) {
            return res.status(404).json({ message: "Patient Not Found!" });
        }

        const doctor = await Employee.findOne({ employeeCode: doctorEmployeeId,designation: 'Doctor' });
        if (!doctor) {
            return res.status(404).json({ message: "Doctor Not Found" });
        }

        const creator = await Employee.findOne({ employeeCode: createdByEmployeeId });
        if (!creator) {
            return res.status(404).json({ message: "Creator Employee Not Found!" });
        }

        const appointment = await Appointment.create({
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
        return res.status(500).json({ message: err.message });
    }
}

const getAllAppointments = async (req, res) => {
    try {
        const appointment = await Appointment.find();
        if (!appointment) {
            res.status(404).json({ message: "No Appointments Found" });
        }
        return res.status(200).json(appointment);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get All Appointments" });
    }
}

const getDoctors = async (req, res) => {
    try {
        const doctor = await Employee.find({ designation: 'Doctor' }).sort({ name: 1 });
        if (!doctor) {
            res.status(404).json({ message: "No Doctors Found" });
        }
        return res.status(200).json(doctor);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get All Doctors" });
    }
}

const getAppointmentUiData = async(req,res) => {
    try{
        const appointmentCount = await Appointment.find().countDocuments();
        if(!appointmentCount){
            return res.status(404).json({ message: "No Appointment Found" });
        }

        const bookedCount = await Appointment.find({status: 'Booked'}).countDocuments();
        const cancelledCount = await Appointment.find({status: 'Cancelled'}).countDocuments();
        const completedCount = await Appointment.find({status: 'Completed'}).countDocuments();

        return res.status(200).json({
            appointmentCount: appointmentCount,
            bookedCount: bookedCount,
            cancelledCount: cancelledCount,
            completedCount: completedCount,
        })
    } catch(err){
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get All Doctors" });
    }
}

const deleteAppointment = async (req,res) => {
    try {
        const appointmentId = req.query.appointmentId;
        const appointment = await Appointment.findOne({ appointmentId: appointmentId});
        if(!appointment){
            return res.status(404).json({message: "Appointment Not Found"});
        }
        await appointment.deleteOne();
        return res.status(200).json({message: 'Appointment Deleted Sucessfully'});
    } catch(err){
        console.error(err);
        return res.status(500).json({ message: "Server Error During Delete Appointment" });
    }
}

module.exports = { createAppointment, getAllAppointments, getDoctors, getAppointmentUiData, deleteAppointment }

