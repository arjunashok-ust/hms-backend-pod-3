const MedicalRecord = require('../models/medical-record.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

const ERR = require('../utils/errors.utils');
const { isPatient, assertPatientOwnsId } = require('../utils/access.utils');
const { toSkip, buildPage } = require('../utils/pagination.utils');
const { caseInsensitive } = require('../utils/regex.utils');
const { pickDefined } = require('../utils/object.utils');
const { SUCCESS_MESSAGES } = require('../constants/messages.constants');
const { ROLES } = require('../constants/roles.constants');
const { MEDICAL_RECORD_STATUS } = require('../constants/app.constants');

const live = { isDeleted: false };

// the doctor, patient and appointment of a record must exist and belong together
const assertRecordRelations = async ({ doctorId, patientId, appointmentId }) => {
    if (!(await User.exists({ role: ROLES.DOCTOR, employeeId: doctorId }))) throw ERR.doctorNotFound();
    if (!(await Patient.exists({ uhid: patientId }))) throw ERR.patientNotFound();
    if (!(await Appointment.exists({ appointmentId, patientId, doctorEmployeeId: doctorId }))) {
        throw ERR.appointmentNotFound();
    }
};

const createMedicalRecord = async (actor, input) => {
    await assertRecordRelations(input);

    const { doctorId, patientId, appointmentId } = input;
    if (await MedicalRecord.exists({ doctorId, patientId, appointmentId })) throw ERR.medicalRecordExists();

    const record = await MedicalRecord.create({ ...pickDefined(input), createdBy: actor.userId });

    return { message: SUCCESS_MESSAGES.MEDICAL_RECORD_CREATED, medicalRecordId: record.medicalRecordId };
};

const updateMedicalRecord = async (actor, { medicalRecordId, ...fields }) => {
    await assertRecordRelations(fields);

    const record = await MedicalRecord.findOneAndUpdate(
        { medicalRecordId, ...live },
        { ...pickDefined(fields), updatedBy: actor.userId, updatedAt: new Date() },
        { new: true },
    );
    if (!record) throw ERR.medicalRecordNotFound();

    return { message: SUCCESS_MESSAGES.MEDICAL_RECORD_UPDATED };
};

const getMedicalRecordStats = async () => {
    const [medicalRecordCount, completedCount, draftCount, deletedCount] = await Promise.all([
        MedicalRecord.countDocuments(live),
        MedicalRecord.countDocuments({ status: MEDICAL_RECORD_STATUS.COMPLETED, ...live }),
        MedicalRecord.countDocuments({ status: MEDICAL_RECORD_STATUS.DRAFT, ...live }),
        MedicalRecord.countDocuments({ isDeleted: true }),
    ]);

    return { medicalRecordCount, completedCount, draftCount, deletedCount };
};

const getMedicalRecords = async (actor, { page, limit, selectedText, patientId, doctorId, isClientApp }) => {
    const filter = { ...live };
    if (selectedText) filter.medicalRecordId = caseInsensitive(selectedText);
    if (isClientApp) filter.status = MEDICAL_RECORD_STATUS.COMPLETED;

    if (isPatient(actor)) {
        // a patient only ever sees their own completed records
        filter.patientId = actor.userId;
        filter.status = MEDICAL_RECORD_STATUS.COMPLETED;
    } else if (doctorId) {
        filter.doctorId = doctorId;
    } else if (patientId) {
        filter.patientId = patientId;
    }

    const [total, data] = await Promise.all([
        MedicalRecord.countDocuments(filter),
        MedicalRecord.find(filter).sort({ created_at: -1 }).skip(toSkip({ page, limit })).limit(limit).lean(),
    ]);

    return buildPage({ data, total, page, limit });
};

const getMedicalRecordById = async (actor, { medicalRecordId }) => {
    const record = await MedicalRecord.findOne({ medicalRecordId, ...live }).lean();
    if (!record) throw ERR.medicalRecordNotFound();

    assertPatientOwnsId(actor, record.patientId);
    if (isPatient(actor) && record.status !== MEDICAL_RECORD_STATUS.COMPLETED) throw ERR.medicalRecordNotFound();

    return record;
};

const deleteMedicalRecord = async (actor, { medicalRecordId }) => {
    const record = await MedicalRecord.findOneAndUpdate(
        { medicalRecordId, ...live },
        { isDeleted: true, deletedBy: actor.userId, deletedAt: new Date() },
    );
    if (!record) throw ERR.medicalRecordNotFound();

    return { message: SUCCESS_MESSAGES.MEDICAL_RECORD_DELETED };
};

module.exports = {
    createMedicalRecord,
    updateMedicalRecord,
    getMedicalRecordStats,
    getMedicalRecords,
    getMedicalRecordById,
    deleteMedicalRecord,
};
