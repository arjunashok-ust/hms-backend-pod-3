const Appointment = require('../models/appointment.model');
const Employee = require('../models/employee.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');

const userService = require('./user.service');
const ERR = require('../utils/errors.utils');
const { isPatient, assertPatientOwnsId } = require('../utils/access.utils');
const { toSkip, buildPage } = require('../utils/pagination.utils');
const { startOfDay } = require('../utils/date.utils');
const { escapeRegex } = require('../utils/regex.utils');
const { SUCCESS_MESSAGES } = require('../constants/messages.constants');
const { ROLES } = require('../constants/roles.constants');
const { USER_STATUS, APPOINTMENT_STATUS } = require('../constants/app.constants');

const live = { isDeleted: false };

// a slot is taken by any live appointment of the same doctor that was not cancelled
const findSlotConflict = (filter, excludeAppointmentId) =>
    Appointment.findOne({
        ...filter,
        status: { $ne: APPOINTMENT_STATUS.CANCELLED },
        ...live,
        ...(excludeAppointmentId && { appointmentId: { $ne: excludeAppointmentId } }),
    }).lean();

const findAppointmentOrThrow = async (appointmentId) => {
    const appointment = await Appointment.findOne({ appointmentId, ...live }).lean();
    if (!appointment) throw ERR.appointmentNotFound();
    return appointment;
};

const createAppointment = async (actor, input) => {
    const { patientId, doctorEmployeeId, timeSlot, status } = input;
    const date = startOfDay(input.date);

    assertPatientOwnsId(actor, patientId);
    if (date < startOfDay(new Date())) throw ERR.appointmentPastTime();

    const patient = await Patient.exists({ uhid: patientId, ...live });
    if (!patient) throw ERR.patientNotFound();

    const doctor = await User.exists({
        employeeId: doctorEmployeeId,
        role: ROLES.DOCTOR,
        status: USER_STATUS.ACTIVE,
        ...live,
    });
    if (!doctor) throw ERR.doctorNotFound();

    const creator = await User.exists({ $or: [{ employeeId: actor.userId }, { patientId: actor.userId }], ...live });
    if (!creator) throw ERR.employeeNotFound();

    if (await findSlotConflict({ doctorEmployeeId, date, timeSlot })) throw ERR.existingSlot();
    if (await findSlotConflict({ patientId, date, timeSlot })) throw ERR.existingPatientAppointment();

    const appointment = await Appointment.create({
        patientId,
        doctorEmployeeId,
        date,
        timeSlot,
        status,
        createdByEmployeeId: actor.userId,
    });

    return {
        message: SUCCESS_MESSAGES.APPOINTMENT_CREATED,
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        status: appointment.status,
    };
};

const getAllAppointments = async (actor, { page, limit, selectedText }) => {
    const filter = { ...live };
    if (selectedText) filter.$text = { $search: selectedText };
    if (isPatient(actor)) filter.patientId = actor.userId;

    const [total, data] = await Promise.all([
        Appointment.countDocuments(filter),
        Appointment.find(filter).sort({ _id: 1 }).skip(toSkip({ page, limit })).limit(limit).lean(),
    ]);

    return buildPage({ data, total, page, limit });
};

const getDoctors = async () => {
    const doctorIds = await User.distinct('employeeId', { role: ROLES.DOCTOR, status: USER_STATUS.ACTIVE, ...live });
    if (doctorIds.length === 0) return [];

    return Employee.find({ employeeCode: { $in: doctorIds }, ...live }).sort({ name: 1 }).lean();
};

const getAppointmentUiData = async () => {
    const [appointmentCount, bookedCount, cancelledCount, completedCount] = await Promise.all([
        Appointment.countDocuments(live),
        Appointment.countDocuments({ status: APPOINTMENT_STATUS.BOOKED, ...live }),
        Appointment.countDocuments({ status: APPOINTMENT_STATUS.CANCELLED, ...live }),
        Appointment.countDocuments({ status: APPOINTMENT_STATUS.COMPLETED, ...live }),
    ]);

    return { appointmentCount, bookedCount, cancelledCount, completedCount };
};

const deleteAppointment = async (actor, { appointmentId }) => {
    const appointment = await findAppointmentOrThrow(appointmentId);
    assertPatientOwnsId(actor, appointment.patientId);

    await Appointment.updateOne(
        { appointmentId, ...live },
        { isDeleted: true, deletedBy: actor.userId, deletedAt: new Date() },
    );

    return { message: SUCCESS_MESSAGES.APPOINTMENT_DELETED };
};

// "APT-12", "emp 7", "000042" style searches match ids exactly, anything else uses the text index
const buildSearchFilter = (selectedText) => {
    const idLike = /^(APT|EMP)?-?(\d+)$/i.exec(selectedText);
    if (!idLike) return { $text: { $search: selectedText } };

    const prefix = idLike[1]?.toUpperCase();
    const digits = idLike[2].padStart(6, '0');
    const appointmentId = { appointmentId: { $regex: `^APT-${digits}$`, $options: 'i' } };
    const doctorEmployeeId = { doctorEmployeeId: { $regex: `^EMP-${digits}$`, $options: 'i' } };

    if (prefix === 'APT') return appointmentId;
    if (prefix === 'EMP') return doctorEmployeeId;
    return { $or: [appointmentId, doctorEmployeeId] };
};

const getAppointmentsByPatientId = async (actor, { patientId, page, limit, selectedText }) => {
    assertPatientOwnsId(actor, patientId);

    const patient = await Patient.exists({ uhid: patientId, ...live });
    if (!patient) throw ERR.patientNotFound();

    const filter = { patientId, ...live };
    if (selectedText) Object.assign(filter, buildSearchFilter(selectedText));

    const [total, data] = await Promise.all([
        Appointment.countDocuments(filter),
        Appointment.find(filter).sort({ date: -1 }).skip(toSkip({ page, limit })).limit(limit).lean(),
    ]);

    return buildPage({ data, total, page, limit });
};

const getDoctorByEmployeeId = ({ employeeId }) => userService.findDoctorByCode(employeeId);

const editAppointment = async (actor, input) => {
    const { appointmentId, patientId, doctorEmployeeId, timeSlot, status } = input;
    const date = startOfDay(input.date);

    const current = await findAppointmentOrThrow(appointmentId);
    assertPatientOwnsId(actor, current.patientId);
    assertPatientOwnsId(actor, patientId);

    if (await findSlotConflict({ doctorEmployeeId, date, timeSlot }, appointmentId)) throw ERR.existingSlot();

    const updated = await Appointment.findOneAndUpdate(
        { appointmentId, ...live },
        { $set: { patientId, doctorEmployeeId, date, timeSlot, ...(status && { status }) } },
        { new: true, runValidators: true },
    );
    if (!updated) throw ERR.appointmentNotFound();

    return { message: SUCCESS_MESSAGES.APPOINTMENT_UPDATED };
};

const editAppointmentStatus = async ({ appointmentId, status }) => {
    const appointment = await Appointment.findOneAndUpdate(
        { appointmentId, ...live },
        { status },
        { new: true, runValidators: true },
    );
    if (!appointment) throw ERR.appointmentNotFound();

    return { message: SUCCESS_MESSAGES.APPOINTMENT_STATUS_UPDATED };
};

// completed appointments narrowed by doctor / patient / appointment id
const getAppointmentByDoctorIdOrPatientId = async (actor, { doctorId, patientId, appointmentId }) => {
    const filter = { status: APPOINTMENT_STATUS.COMPLETED, ...live };
    const scopedPatientId = isPatient(actor) ? actor.userId : patientId;

    if (doctorId) filter.doctorEmployeeId = doctorId;
    if (scopedPatientId) filter.patientId = scopedPatientId;
    if (appointmentId && !doctorId && !scopedPatientId) {
        filter.appointmentId = { $regex: escapeRegex(appointmentId), $options: 'i' };
    }

    return Appointment.find(filter).lean();
};

module.exports = {
    createAppointment,
    getAllAppointments,
    getDoctors,
    getAppointmentUiData,
    deleteAppointment,
    getAppointmentsByPatientId,
    getDoctorByEmployeeId,
    editAppointment,
    editAppointmentStatus,
    getAppointmentByDoctorIdOrPatientId,
};
