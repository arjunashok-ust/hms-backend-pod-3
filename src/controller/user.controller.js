const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');
const { json } = require('express');

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

const getPatients = asyncHandler(async (req, res) => {
    const selectedText = req.query.selectedText?.trim();
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = {}

    if (selectedText) {
        filter.$text = { $search: selectedText }
    }

    const patients = await Patient.find(filter).skip(skip).limit(limit);

    const total = await Patient.countDocuments();

    return res.status(200).json({
        data: patients,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
    })
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
        allergies: patient.allergies,
        bloodGroup: patient.bloodGroup,
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
        bloodGroup,
        allergies,
        emergencyContact,
    } = req.body;

    const patient = await Patient.findOneAndUpdate({ uhid: patientId }, {
        name,
        gender,
        dob,
        address,
        bloodGroup,
        allergies,
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

const getPatientsBySearch = asyncHandler(async (req, res) => {
    const {
        searchText,
    } = req.query;

    const patients = await Patient.find({
        $or: [
            { uhid: { $regex: searchText, $options: "i" } },
            { name: { $regex: searchText, $options: "i" } },
        ]
    });

    return res.status(200).json(patients);
});

const getDoctorsBySearch = asyncHandler(async (req, res) => {
    const {
        searchText,
    } = req.query;

    const doctors = await Employee.find({
        $or: [
            { employeeCode: { $regex: searchText, $options: "i" } },
            { name: { $regex: searchText, $options: "i" } },
            { specialization: { $regex: searchText, $options: "i" } }
        ]
    });

    return res.status(200).json(doctors);
});

const getPatientById = asyncHandler(async (req, res) => {
    const patientId = req.query.patientId;

    const patient = await Patient.findOne({ uhid: patientId });
    if (!patient) return ERR.patientNotFound();

    return res.status(200).json(patient);
});

const getDoctorById = asyncHandler(async (req, res) => {
    const doctorId = req.query.doctorId;

    const doctor = await Employee.findOne({ employeeCode: doctorId });
    if (!doctor) return ERR.doctorNotFound();

    return res.status(200).json(doctor);
});


const getSingleUser = asyncHandler(async (req, res) => {
    const email = req.query.email;

    const employee = await Employee.findOne({ email });
    if (!employee) {
        throw ERR.employeeNotFound();
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw ERR.userNotFound();
    }

    return res.status(200).json({
        name: employee?.name || null,
        email: user.email,
        status: user.status,
        role: user.role,
        employeeId: user.employeeId,
        isVerified: user.isVerified,
        firstLogin: user.firstLogin,
        department: employee?.department || null,
        designation: employee?.designation || null,
        joiningDate: employee?.joiningDate || null,
        medicalRegistrationNo: employee?.medicalRegistrationNo || null,
        specialization: employee?.specialization || null,
        qualification: employee?.qualification || null,
        consultationFee: employee?.consultationFee || null,
        availabilitySlots: employee?.availabilitySlots || [],
    })
})



module.exports = {
    getUserProfile,
    getPatients,
    deletePatient,
    getPatientProfile,
    getPatientId,
    getAvailableTimeSlots,
    updatePatientProfile,
    getPatientsBySearch,
    getDoctorsBySearch,
    getPatientById,
    getDoctorById,
    getSingleUser
}