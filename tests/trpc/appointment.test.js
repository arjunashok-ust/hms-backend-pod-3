jest.mock('../../src/models/role.model');
jest.mock('../../src/models/appointment.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/patient.model');
jest.mock('../../src/models/employee.model');

const Role = require('../../src/models/role.model');
const Appointment = require('../../src/models/appointment.model');
const User = require('../../src/models/user.model');
const Patient = require('../../src/models/patient.model');
const Employee = require('../../src/models/employee.model');
const { callerFor, USERS, query, grantPermissions, expectTRPCError } = require('./helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../../src/constants/messages.constants');
const { PERMISSIONS: P } = require('../../src/constants/permissions.constants');

const tomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
};

const booking = { patientId: 'PAT-000001', doctorEmployeeId: 'EMP-000002', date: tomorrow(), timeSlot: '10:00' };

describe('appointment router', () => {
    beforeEach(() => {
        grantPermissions(Role, Object.values(P), 'Admin');
    });

    describe('createAppointment', () => {
        beforeEach(() => {
            Patient.exists.mockResolvedValue({ _id: 1 });
            User.exists.mockResolvedValue({ _id: 1 });
            Appointment.findOne.mockReturnValue(query(null));
            Appointment.create.mockResolvedValue({ appointmentId: 'APT-000001', date: booking.date, status: 'Booked' });
        });

        it('books the slot, normalises the date and records the caller as creator', async () => {
            const { caller } = callerFor(USERS.admin);

            const result = await caller.appointment.createAppointment(booking);

            expect(result).toMatchObject({ message: SUCCESS_MESSAGES.APPOINTMENT_CREATED, appointmentId: 'APT-000001', status: 'Booked' });
            const stored = Appointment.create.mock.calls[0][0];
            expect(stored).toMatchObject({ createdByEmployeeId: USERS.admin.userId, status: 'Booked' });
            expect([stored.date.getHours(), stored.date.getMinutes(), stored.date.getSeconds()]).toEqual([0, 0, 0]);
        });

        it('rejects a slot the doctor already has with CONFLICT', async () => {
            Appointment.findOne.mockReturnValueOnce(query({ appointmentId: 'APT-000009' }));
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(caller.appointment.createAppointment(booking), 'CONFLICT', ERROR_MESSAGES.EXISTING_SLOT);
        });

        it('rejects a patient double booked at the same time', async () => {
            Appointment.findOne.mockReturnValueOnce(query(null)).mockReturnValueOnce(query({ appointmentId: 'APT-000009' }));
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.appointment.createAppointment(booking),
                'BAD_REQUEST',
                ERROR_MESSAGES.EXISTING_PATIENT_APPOINTMENT,
            );
        });

        it('rejects dates in the past', async () => {
            const { caller } = callerFor(USERS.admin);
            const yesterday = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

            await expectTRPCError(
                caller.appointment.createAppointment({ ...booking, date: yesterday }),
                'BAD_REQUEST',
                ERROR_MESSAGES.APPOINTMENT_PAST_TIME,
            );
        });

        it('only lets a patient book for themselves', async () => {
            const { caller } = callerFor(USERS.patient);

            await expectTRPCError(
                caller.appointment.createAppointment({ ...booking, patientId: 'PAT-000099' }),
                'FORBIDDEN',
                ERROR_MESSAGES.ACCESS_DENIED,
            );
        });

        it('fails when the doctor is not active', async () => {
            User.exists.mockResolvedValueOnce(null);
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(caller.appointment.createAppointment(booking), 'NOT_FOUND', ERROR_MESSAGES.DOCTOR_NOT_FOUND);
        });

        it('requires every booking field', async () => {
            const { caller } = callerFor(USERS.admin);

            const error = await expectTRPCError(caller.appointment.createAppointment({}), 'BAD_REQUEST');

            expect(error.cause.issues.map((issue) => issue.message)).toEqual(
                expect.arrayContaining(['Patient Id is Required', 'Doctor Id is Required', 'Date is Required', 'Time Slot is Required']),
            );
        });
    });

    describe('getAllAppointments', () => {
        it('confines a patient to their own appointments', async () => {
            grantPermissions(Role, [P.VIEW_APPOINTMENT], 'Patient');
            Appointment.countDocuments.mockResolvedValue(0);
            Appointment.find.mockReturnValue(query([]));
            const { caller } = callerFor(USERS.patient);

            await caller.appointment.getAllAppointments({});

            expect(Appointment.find).toHaveBeenCalledWith({ isDeleted: false, patientId: USERS.patient.userId });
        });
    });

    describe('getAppointmentsByPatientId', () => {
        beforeEach(() => {
            Patient.exists.mockResolvedValue({ _id: 1 });
            Appointment.countDocuments.mockResolvedValue(0);
            Appointment.find.mockReturnValue(query([]));
        });

        it('keeps the patient filter when the search looks like a patient id', async () => {
            const { caller } = callerFor(USERS.admin);

            await caller.appointment.getAppointmentsByPatientId({ patientId: 'PAT-000001', selectedText: 'PAT-000002' });

            expect(Appointment.find).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'PAT-000001' }));
        });

        it.each([
            ['APT-12', { appointmentId: { $regex: '^APT-000012$', $options: 'i' } }],
            ['emp 7'.replace(' ', '-'), { doctorEmployeeId: { $regex: '^EMP-000007$', $options: 'i' } }],
        ])('turns the id style search %s into an exact match', async (selectedText, expected) => {
            const { caller } = callerFor(USERS.admin);

            await caller.appointment.getAppointmentsByPatientId({ patientId: 'PAT-000001', selectedText });

            expect(Appointment.find).toHaveBeenCalledWith(expect.objectContaining(expected));
        });

        it('uses the text index for free text', async () => {
            const { caller } = callerFor(USERS.admin);

            await caller.appointment.getAppointmentsByPatientId({ patientId: 'PAT-000001', selectedText: 'follow up' });

            expect(Appointment.find).toHaveBeenCalledWith(expect.objectContaining({ $text: { $search: 'follow up' } }));
        });

        it("blocks a patient from another patient's appointments", async () => {
            grantPermissions(Role, [P.VIEW_APPOINTMENT], 'Patient');
            const { caller } = callerFor(USERS.patient);

            await expectTRPCError(
                caller.appointment.getAppointmentsByPatientId({ patientId: 'PAT-000099' }),
                'FORBIDDEN',
            );
        });
    });

    describe('deleteAppointment', () => {
        it('soft deletes on behalf of the caller', async () => {
            Appointment.findOne.mockReturnValue(query({ appointmentId: 'APT-000001', patientId: 'PAT-000001' }));
            Appointment.updateOne.mockResolvedValue({});
            const { caller } = callerFor(USERS.admin);

            const result = await caller.appointment.deleteAppointment({ appointmentId: 'APT-000001' });

            expect(result.message).toBe(SUCCESS_MESSAGES.APPOINTMENT_DELETED);
            expect(Appointment.updateOne).toHaveBeenCalledWith(
                { appointmentId: 'APT-000001', isDeleted: false },
                expect.objectContaining({ isDeleted: true, deletedBy: USERS.admin.userId }),
            );
        });

        it("stops a patient deleting someone else's appointment", async () => {
            grantPermissions(Role, [P.DELETE_APPOINTMENT], 'Patient');
            Appointment.findOne.mockReturnValue(query({ appointmentId: 'APT-000005', patientId: 'PAT-000099' }));
            const { caller } = callerFor(USERS.patient);

            await expectTRPCError(caller.appointment.deleteAppointment({ appointmentId: 'APT-000005' }), 'FORBIDDEN');
            expect(Appointment.updateOne).not.toHaveBeenCalled();
        });
    });

    describe('editAppointment', () => {
        const edit = { appointmentId: 'APT-000001', ...booking };

        it('ignores the appointment itself when checking for slot conflicts', async () => {
            const q = query({ appointmentId: 'APT-000001', patientId: 'PAT-000001' });
            Appointment.findOne.mockReturnValueOnce(q).mockReturnValueOnce(query(null));
            Appointment.findOneAndUpdate.mockResolvedValue({});
            const { caller } = callerFor(USERS.admin);

            await caller.appointment.editAppointment(edit);

            expect(Appointment.findOne.mock.calls[1][0]).toMatchObject({ appointmentId: { $ne: 'APT-000001' } });
        });

        it('reports NOT_FOUND for an unknown appointment', async () => {
            Appointment.findOne.mockReturnValue(query(null));
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(caller.appointment.editAppointment(edit), 'NOT_FOUND', ERROR_MESSAGES.APPOINTMENT_NOT_FOUND);
        });
    });

    describe('editAppointmentStatus', () => {
        it('only accepts known statuses', async () => {
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.appointment.editAppointmentStatus({ appointmentId: 'APT-000001', status: 'Teleported' }),
                'BAD_REQUEST',
            );
        });
    });

    describe('user.getAvailableTimeSlots', () => {
        it('returns the doctor slots that are still free', async () => {
            Employee.findOne.mockReturnValue(query({ employeeCode: 'EMP-000002', availabilitySlots: ['09:00', '10:00', '11:00'] }));
            Appointment.distinct.mockResolvedValue(['10:00']);
            const { caller } = callerFor(USERS.admin);

            await expect(caller.user.getAvailableTimeSlots({ employeeId: 'EMP-000002', date: tomorrow() })).resolves.toEqual({
                slots: ['09:00', '11:00'],
            });
        });

        it('reports when the doctor is fully booked', async () => {
            Employee.findOne.mockReturnValue(query({ employeeCode: 'EMP-000002', availabilitySlots: ['09:00'] }));
            Appointment.distinct.mockResolvedValue(['09:00']);
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.user.getAvailableTimeSlots({ employeeId: 'EMP-000002', date: tomorrow() }),
                'NOT_FOUND',
                ERROR_MESSAGES.DOCTOR_NO_SLOT,
            );
        });

        it('rejects past dates', async () => {
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.user.getAvailableTimeSlots({ employeeId: 'EMP-000002', date: new Date('2020-01-01') }),
                'BAD_REQUEST',
                ERROR_MESSAGES.APPOINTMENT_PAST_TIME,
            );
        });
    });
});
