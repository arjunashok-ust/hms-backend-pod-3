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
        throw ERR.doctorNotFound();
    }

    const existingPatient = await Patient.findOne({ uhid: patientId });
    if (!existingPatient) {
        throw ERR.patientNotFound();
    }

    const existingAppointment = await Appointment.findOne({ appointmentId: appointmentId });
    if (!existingAppointment) {
        throw ERR.appointmentNotFound();
    }

    const existingMedicalRecord = await MedicalRecord.findOne({ appointmentId: appointmentId, patientId: patientId, doctorId: doctorId });

    if (existingMedicalRecord) {
        throw ERR.medicalRecordExists();
    }

    const existingCreator = await User.findOne({ employeeId: createdBy });
    if (!existingCreator) {
        throw ERR.employeeNotFound();
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
        status,
        createdBy,
    });

    return res.status(200).json({ message: "Medical record created successfully." });
});

const updateMedicalRecord = asyncHandler(async (req, res) => {
    const {
        medicalRecordId,
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
        updatedBy,
        updatedAt,
    } = req.body;

    const existingPatient = await Patient.findOne({ uhid: patientId });
    if (!existingPatient) {
        throw ERR.patientNotFound();
    }

    const existingDoctor = await User.findOne({ role: 'Doctor', employeeId: doctorId });
    if (!existingDoctor) {
        throw ERR.doctorNotFound();
    }

    const existingAppointment = await Appointment.findOne({ appointmentId: appointmentId });
    if (!existingAppointment) {
        throw ERR.appointmentNotFound();
    }

    const existingCreator = await User.findOne({ employeeId: createdBy });
    if (!existingCreator) {
        throw ERR.employeeNotFound();
    }

    const updatedRecord = await MedicalRecord.findOneAndUpdate({ medicalRecordId }, {
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
        updatedAt,
        updatedBy,
    },
        {
            new: true,
        }
    );

    if (!updatedRecord) {
        throw ERR.medicalRecordNotFound();
    }

    return res.status(200).json({ message: "Medical record updated successfully." });
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

const getMedicalRecords = asyncHandler(async (req, res) => {
    const page = Number.parseInt(req.query.page);
    const limit = Number.parseInt(req.query.limit);

    const skip = (page - 1) * limit;

    const total = await MedicalRecord.countDocuments();

    const medicalRecordData = await MedicalRecord.find().sort({ created_at: -1 }).skip(skip).limit(limit);

    return res.status(200).json({
        data: medicalRecordData,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
});

const getMedicalRecordById = asyncHandler(async (req, res) => {
    const medicalRecordId = req.query.medicalRecordId;

    const medicalRecord = await MedicalRecord.findOne({ medicalRecordId });

    if (!medicalRecord) {
        ERR.medicalRecordNotFound();
    }

    return res.status(200).json(medicalRecord);
})

module.exports = { createMedicalRecord, getMedicalRecordStats, getMedicalRecords, getMedicalRecordById, updateMedicalRecord }