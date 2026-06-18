const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');

// Get User
const getUserProfile = asyncHandler(async (req, res) => {
    const email = req.query.email;

    const user = await User.findOne({ email });
    const employee = await Employee.findOne({ email });

    if (!user) throw ERR.userNotFound();

    return res.status(200).json({
        message: 'Sucessfully obtained user information',
        name: employee.name,
        email: user.email,
        status: user.status,
        role: user.role,
        employeeId: user.employeeId,
        isVerified: user.isVerified,
        firstLogin: user.firstLogin,
        department: employee.department,
        designation: employee.designation,
        joiningDate: employee.joiningDate,
        medicalRegistrationNo: employee.medicalRegistrationNo,
        specialization: employee.specialization,
        qualification: employee.qualification,
        consultationFee: employee.consultationFee,
        availabilitySlots: employee.availabilitySlots
    });
});

const createPatient = asyncHandler(async (req, res) => {
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

    const existingPatient = await Patient.findOne({ email: email });

    if (existingPatient) {
        throw ERR.emailExists();
    }

    const existingUser = await User.findOne({
        email
    });

    if (!existingUser) {
        throw ERR.emailExists();
    }

    await Patient.create({
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
});

const getPatients = asyncHandler(async (req, res) => {
    const patients = await Patient.find();
    if (!patients) {
        throw ERR.patientNotFound();
    }
    return res.status(200).json(patients);
});

const deletePatient = asyncHandler(async (req, res) => {
    const patientId = req.body.patientId;

    const patient = await Patient.findOne({ uhid: patientId });
    if (!patient) {
        throw ERR.patientNotFound();
    }

    await patient.deleteOne();

    const userPatient = await User.findOne({ patientId: patientId });

    if (!userPatient) {
        throw ERR.patientNotFound();
    }

    await userPatient.deleteOne();

    return res.status(200).json({ message: 'Patient Deleted Sucessfully' });
});

const getPatientProfile = asyncHandler(async (req, res) => {
    const email = req.query.email;
    const user = await User.findOne({ email });
    const patient = await Patient.findOne({ email });

    if (!user) throw ERR.userNotFound();

    return res.status(200).json({
        message: 'Sucessfully obtained user information',
        email: user.email,
        status: user.status,
        role: user.role,
        isVerified: user.isVerified,
        uhid: patient.uhid,
        name: patient.name,
        gender: patient.gender,
        dob: patient.dob,
        address: patient.address,
        phone: patient.phone,
        emergencyContact: patient.emergencyContact,
    });
});

const getPatientId = asyncHandler(async (req, res) => {
    const email = req.query.email;
    const patient = await Patient.findOne({ email });
    if (!patient) throw ERR.patientNotFound();
    return res.status(200).json({
        message: "Patient id sent successfully",
        patientId: patient.uhid,
    })
});

const getAvailableTimeSlots = asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId;
    const inputDate = new Date(req.query.date);
    const today = new Date();

    if (inputDate <= today) throw ERR.appointmentPastTime();

    const date = inputDate.toDateString();

    const doctor = await Employee.findOne({ employeeCode: employeeId });
    if (!doctor) throw ERR.doctorNotFound();
    const appointments = await Appointment.find();

    const allSlots = doctor.availabilitySlots;
    if (!allSlots) throw ERR.doctorNoSlot();

    const bookedSlots = new Set(
        appointments
            .filter((appointment) => {
                const apt_date = new Date(appointment.date).toDateString();
                return (
                    appointment.doctorEmployeeId === doctor.employeeCode &&
                    date === apt_date &&
                    appointment.status !== "Cancelled" && appointment.status !== "Completed"
                );
            })
            .map((appointment) => appointment.timeSlot)
    );

    const slots = allSlots.filter((slot) => !bookedSlots.has(slot));

    if (slots.length === 0) {
        throw ERR.doctorNoSlot();
    }

    return res.status(200).json({
        message: "slots fetched sucessfully",
        slots,
    })
});

const updatePatientProfile = asyncHandler(async (req, res) => {
    const {
        patientId,
        name,
        gender,
        dob,
        address,
        emergencyContact,
    } = req.body;

    const patient = await Patient.findOneAndUpdate({ uhid: patientId }, {
        name,
        gender,
        dob,
        address,
        emergencyContact,
    },
        {
            new: true,
            runValidators: true,
        }
    );

    if (!patient) {
        throw ERR.patientNotFound();
    }

    return res.status(200).json({ message: "Patient profile updated successfully." });
});



module.exports = { getUserProfile, createPatient, getPatients, deletePatient, getPatientProfile, getPatientId, getAvailableTimeSlots, updatePatientProfile }