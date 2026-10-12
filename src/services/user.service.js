const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');
const MedicalRecord = require('../models/medical-record.model');

const ERR = require('../utils/errors.utils');
const { assertStaff, assertPatientOwnsId, assertPatientOwnsEmail } = require('../utils/access.utils');
const { caseInsensitive } = require('../utils/regex.utils');
const { toSkip, buildPage } = require('../utils/pagination.utils');
const { startOfDay, endOfDay } = require('../utils/date.utils');
const { pickDefined } = require('../utils/object.utils');
const { SUCCESS_MESSAGES } = require('../constants/messages.constants');
const { APPOINTMENT_STATUS, ADMINISTRATION_DEPARTMENT, SEARCH_RESULT_LIMIT } = require('../constants/app.constants');

const findDoctorByCode = async (employeeCode) => {
    const doctor = await Employee.findOne({ employeeCode, isDeleted: false }).lean();
    if (!doctor) throw ERR.doctorNotFound();
    return doctor;
};

// employee profile + account, shared by getUserProfile and getSingleUser
const getEmployeeProfile = async (actor, { email }) => {
    assertStaff(actor);

    const [employee, user] = await Promise.all([
        Employee.findOne({ email, isDeleted: false }).lean(),
        User.findOne({ email, isDeleted: false }).lean(),
    ]);
    if (!employee) throw ERR.employeeNotFound();
    if (!user) throw ERR.userNotFound();

    return {
        name: employee.name ?? null,
        email: user.email,
        status: user.status,
        role: user.role,
        employeeId: user.employeeId,
        isVerified: user.isVerified,
        firstLogin: user.firstLogin,
        department: employee.department ?? null,
        designation: employee.designation ?? null,
        joiningDate: employee.joiningDate ?? null,
        medicalRegistrationNo: employee.medicalRegistrationNo ?? null,
        specialization: employee.specialization ?? null,
        qualification: employee.qualification ?? null,
        consultationFee: employee.consultationFee ?? null,
        availabilitySlots: employee.availabilitySlots ?? [],
    };
};

const getPatients = async ({ page, limit, selectedText }) => {
    const filter = { isDeleted: false };
    if (selectedText) filter.$text = { $search: selectedText };

    const [total, data] = await Promise.all([
        Patient.countDocuments(filter),
        Patient.find(filter).sort({ _id: 1 }).skip(toSkip({ page, limit })).limit(limit).lean(),
    ]);

    return buildPage({ data, total, page, limit });
};

const deletePatient = async (actor, { patientId }) => {
    const deletion = { isDeleted: true, deletedBy: actor.userId, deletedAt: new Date() };

    const patient = await Patient.findOneAndUpdate({ uhid: patientId, isDeleted: false }, deletion);
    if (!patient) throw ERR.patientNotFound();

    const account = await User.findOneAndUpdate({ patientId, isDeleted: false }, deletion);
    if (!account) throw ERR.patientNotFound();

    await Appointment.updateMany({ patientId, status: APPOINTMENT_STATUS.BOOKED }, { status: APPOINTMENT_STATUS.CANCELLED });
    await Appointment.updateMany({ patientId }, deletion);
    await MedicalRecord.updateMany({ patientId }, deletion);

    return { message: SUCCESS_MESSAGES.PATIENT_DELETED };
};

const getPatientProfile = async (actor, { email }) => {
    assertPatientOwnsEmail(actor, email);

    const [user, patient] = await Promise.all([
        User.findOne({ email, isDeleted: false }).lean(),
        Patient.findOne({ email, isDeleted: false }).lean(),
    ]);
    if (!user) throw ERR.userNotFound();
    if (!patient) throw ERR.patientNotFound();

    return {
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
    };
};

const getPatientId = async (actor, { email }) => {
    assertPatientOwnsEmail(actor, email);

    const patient = await Patient.findOne({ email, isDeleted: false }).lean();
    if (!patient) throw ERR.patientNotFound();

    return { patientId: patient.uhid };
};

const getAvailableTimeSlots = async ({ employeeId, date }) => {
    if (date <= new Date()) throw ERR.appointmentPastTime();

    const doctor = await findDoctorByCode(employeeId);
    if (!doctor.availabilitySlots?.length) throw ERR.doctorNoSlot();

    const bookedSlots = new Set(
        await Appointment.distinct('timeSlot', {
            doctorEmployeeId: doctor.employeeCode,
            date: { $gte: startOfDay(date), $lt: endOfDay(date) },
            status: { $nin: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.COMPLETED] },
            isDeleted: false,
        }),
    );

    const slots = doctor.availabilitySlots.filter((slot) => !bookedSlots.has(slot));
    if (slots.length === 0) throw ERR.doctorNoSlot();

    return { slots };
};

const updatePatientProfile = async (actor, { patientId, ...fields }) => {
    assertPatientOwnsId(actor, patientId);

    const patient = await Patient.findOneAndUpdate(
        { uhid: patientId, isDeleted: false },
        pickDefined(fields),
        { new: true, runValidators: true },
    );
    if (!patient) throw ERR.patientNotFound();

    return { message: SUCCESS_MESSAGES.PATIENT_PROFILE_UPDATED };
};

const getPatientsBySearch = async ({ searchText }) =>
    Patient.find({
        isDeleted: false,
        $or: [{ uhid: caseInsensitive(searchText) }, { name: caseInsensitive(searchText) }],
    })
        .limit(SEARCH_RESULT_LIMIT)
        .lean();

const getDoctorsBySearch = async ({ searchText }) =>
    Employee.find({
        isDeleted: false,
        department: { $ne: ADMINISTRATION_DEPARTMENT },
        $or: [
            { employeeCode: caseInsensitive(searchText) },
            { name: caseInsensitive(searchText) },
            { specialization: caseInsensitive(searchText) },
        ],
    })
        .limit(SEARCH_RESULT_LIMIT)
        .lean();

const getPatientById = async (actor, { patientId }) => {
    assertPatientOwnsId(actor, patientId);

    const patient = await Patient.findOne({ uhid: patientId, isDeleted: false }).lean();
    if (!patient) throw ERR.patientNotFound();

    return patient;
};

const getDoctorById = ({ doctorId }) => findDoctorByCode(doctorId);

module.exports = {
    findDoctorByCode,
    getEmployeeProfile,
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
};
