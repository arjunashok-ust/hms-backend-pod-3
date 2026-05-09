const Appointment = require('../models/appointment.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/employee.model');

// create appointment
const createAppointment = async (req,res) => {
    const {
        patientId,
        doctorId,
        date,
        timeSlot,
        status,
        employeeId, 
    } = req.body;

    const patient = await Patient.findOne({uhid: patientId});
    if(!patient) return res.status(404).json({message: 'patient not found.'});
    const doctor = await Employee.findOne({employeeCode: doctorId});
    if(!doctor) return res.status(404).json({message: 'doctor not found.'});
    const employee = await Employee.findOne({employeeId});
    if(!employee) return res.status(404).json({message: 'employee not found.'});

    const appointment = await Appointment.create({
        patientId: patientId,
        doctorEmployeeId: doctorId,
        date: date,
        timeSlot: timeSlot,
        status: status,
        createdByEmployeeId: employeeId
    });

    return res.status(200).json({
        message: 'appointment created sucessfully.',
        appointmentId: appointmentId,
        date: data,
    });
}