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

    const existingAppointment = await Appointment.findOne({ appointmentId, patientId, doctorEmployeeId: doctorId });
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

    const updatedRecord = await MedicalRecord.findOneAndUpdate({ medicalRecordId, isDeleted: false }, {
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
            MedicalRecord.countDocuments({ isDeleted: true }),
        ]);

    return res.status(200).json({
        medicalRecordCount,
        completedCount,
        draftCount,
        deletedCount,
    });
});

const getMedicalRecords = asyncHandler(async (req, res) => {
    const selectedText = req.query.selectedText?.trim();
    const page = normalizeNumber(req.query.page, 1);
    const limit = normalizeNumber(req.query.limit, 5);
    const patientId = req.query.patientId;
    const doctorId = req.query.doctorId;
    const isClientApp = req.query.isClientApp;

    const skip = (page - 1) * limit;
    const filter = {
        isDeleted: false,
    }

    if (selectedText) {
        const isIdLike = /^(REC-?|APT-?|PAT-?|EMP-?)?\d+$/i.test(selectedText);

        if (isIdLike) {
            const normalized = selectedText
                .replace(/^(REC-?|APT-?|PAT-?|EMP-?)/i, '')
                .padStart(6, '0');

            const prefix = selectedText.match(/^(REC|APT|PAT|EMP)/i)?.[0]?.toUpperCase();

            if (prefix === 'REC') {
                filter.medicalRecordId = { $regex: `^REC-${normalized}$`, $options: 'i' };
            } else if (prefix === 'APT') {
                filter.appointmentId = { $regex: `^APT-${normalized}$`, $options: 'i' };
            } else if (prefix === 'PAT') {
                filter.patientId = { $regex: `^PAT-${normalized}$`, $options: 'i' };
            } else if (prefix === 'EMP') {
                filter.doctorId = { $regex: `^EMP-${normalized}$`, $options: 'i' };
            } else {
                filter.$or = [
                    { medicalRecordId: { $regex: `^REC-${normalized}$`, $options: 'i' } },
                    { patientId: { $regex: `^PAT-${normalized}$`, $options: 'i' } },
                    { doctorId: { $regex: `^EMP-${normalized}$`, $options: 'i' } },
                    { appointmentId: { $regex: `^APT-${normalized}$`, $options: 'i' } },
                ];
            }
        } else {
            filter.$text = { $search: selectedText };
        }
    }

    if (isClientApp) {
        filter.status = 'Completed';
    }

    if (doctorId) {
        filter.doctorId = doctorId;
    }
    else if (patientId) {
        filter.patientId = patientId;
    }

    const total = await MedicalRecord.countDocuments(filter);

    const medicalRecordData = await MedicalRecord.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit);

    if (!medicalRecordData) {
        throw ERR.medicalRecordNotFound();
    }

    return res.status(200).json({
        data: medicalRecordData,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
});

const getMedicalRecordById = asyncHandler(async (req, res) => {
    const medicalRecordId = req.query.medicalRecordId;

    const medicalRecord = await MedicalRecord.findOne({ medicalRecordId, isDeleted: false });

    if (!medicalRecord) {
        throw ERR.medicalRecordNotFound();
    }

    return res.status(200).json(medicalRecord);
})

const deleteMedicalRecord = asyncHandler(async (req, res) => {

    const medicalRecordId = req.body.medicalRecordId;

    const deletedBy = req.user.userId;

    const deletedMedicalRecord = await MedicalRecord.findOneAndUpdate({ medicalRecordId }, { isDeleted: true, deletedBy: deletedBy, deletedAt: new Date() }, { new: true });

    if (!deletedMedicalRecord) {
        throw ERR.medicalRecordNotFound();
    }

    return res.status(200).json({ message: "Medical record deleted sucessfully" });
})


const normalizeNumber = (value, defaultValue) => {
    const num = Number.parseInt(value);
    return Number.isNaN(num) || num < 1 ? defaultValue : num;
};


module.exports = { createMedicalRecord, getMedicalRecordStats, getMedicalRecords, getMedicalRecordById, updateMedicalRecord, deleteMedicalRecord }