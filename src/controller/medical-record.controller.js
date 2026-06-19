const MedicalRecord = require('../models/medical-record.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

const asyncHandler = require('../utils/asyncHandler.utils');
const ERR = require('../utils/errors.utils');


const createMedicalRecord = asyncHandler(async (req, res) => {
    const {
        doctorId,
        appointmentId,
        patientId,
        diagnosis,
        complaint,
        symptoms,
        medications,
        medicalObservations,
        notes,
        status,
        createdBy,
    } = req.body;

    const existingDoctor = await User.findOne({ role: 'Doctor', employeeId: doctorId });
    if (!existingDoctor) {
        ERR.doctorNotFound();
    }

    const existingPatient = await Patient.findOne({ uhid: patientId });
    if (!existingPatient) {
        ERR.patientNotFound();
    }

    const existingAppointment = await Appointment.findOne({ appointmentId: appointmentId });
    if (!existingAppointment) {
        ERR.appointmentNotFound();
    }

    const existingMedicalRecord = await MedicalRecord.findOne({ appointmentId: appointmentId, patientId: patientId, doctorId: doctorId });

    if (existingMedicalRecord) {
        ERR.medicalRecordExists();
    }

    const existingCreator = await User.findOne({ employeeId: createdBy });
    if (!existingCreator) {
        ERR.employeeNotFound();
    }

    await MedicalRecord.create({
        doctorId,
        appointmentId,
        patientId,
        diagnosis,
        complaint,
        symptoms,
        medications,
        medicalObservations,
        notes,
        status: status,
        createdBy,
    });

    return res.status(200).json({ message: "Medical record created successfully." });
});

const getMedicalRecordStats = asyncHandler(async (req, res) => {
    const [medicalRecordCount, completedCount, draftCount, deletedCount] =
        await Promise.all([
            MedicalRecord.countDocuments(),
            MedicalRecord.countDocuments({ status: 'Completed' }),
            MedicalRecord.countDocuments({ status: 'Draft' }),
            MedicalRecord.countDocuments({ status: 'Deleted' }),
        ]);

    return res.status(200).json({
        medicalRecordCount,
        completedCount,
        draftCount,
        deletedCount,
    });
});

module.exports = { createMedicalRecord, getMedicalRecordStats }