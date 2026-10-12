jest.mock('../../src/models/role.model');
jest.mock('../../src/models/medical-record.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/patient.model');
jest.mock('../../src/models/appointment.model');

const Role = require('../../src/models/role.model');
const MedicalRecord = require('../../src/models/medical-record.model');
const User = require('../../src/models/user.model');
const Patient = require('../../src/models/patient.model');
const Appointment = require('../../src/models/appointment.model');
const { callerFor, USERS, query, grantPermissions, expectTRPCError } = require('./helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../../src/constants/messages.constants');
const { PERMISSIONS: P } = require('../../src/constants/permissions.constants');

const record = {
    medicalRecordId: 'REC-000001',
    doctorId: 'EMP-000002',
    appointmentId: 'APT-000001',
    patientId: 'PAT-000001',
    complaint: 'Fever',
    symptoms: 'Cough',
    diagnosis: 'Flu',
    createdBy: 'EMP-000002',
    status: 'Completed',
    // fields that must never be exposed
    _id: 'mongo-id',
    isDeleted: false,
    deletedBy: 'someone',
};

const relations = { doctorId: 'EMP-000002', appointmentId: 'APT-000001', patientId: 'PAT-000001' };

describe('medicalRecord router', () => {
    beforeEach(() => {
        grantPermissions(Role, Object.values(P), 'Doctor');
        MedicalRecord.countDocuments.mockResolvedValue(1);
        MedicalRecord.find.mockReturnValue(query([record]));
    });

    describe('getMedicalRecords', () => {
        it('returns a page and strips internal fields', async () => {
            const { caller } = callerFor(USERS.doctor);

            const result = await caller.medicalRecord.getMedicalRecords({ page: 2, limit: 10 });

            expect(result).toMatchObject({ total: 1, page: 2, totalPages: 1 });
            expect(result.data[0].medicalRecordId).toBe('REC-000001');
            expect(result.data[0]).not.toHaveProperty('_id');
            expect(result.data[0]).not.toHaveProperty('isDeleted');
            expect(result.data[0]).not.toHaveProperty('deletedBy');
        });

        it('applies defaults and the pagination offset', async () => {
            const { caller } = callerFor(USERS.doctor);
            const q = query([record]);
            MedicalRecord.find.mockReturnValue(q);

            await caller.medicalRecord.getMedicalRecords({ page: 3, limit: 10 });

            expect(q.skip).toHaveBeenCalledWith(20);
            expect(q.limit).toHaveBeenCalledWith(10);
        });

        it('filters staff searches by doctor before patient', async () => {
            const { caller } = callerFor(USERS.doctor);

            await caller.medicalRecord.getMedicalRecords({ doctorId: 'EMP-000002', patientId: 'PAT-000009' });

            expect(MedicalRecord.find).toHaveBeenCalledWith({ isDeleted: false, doctorId: 'EMP-000002' });
        });

        it("pins a patient to their own completed records whatever they ask for", async () => {
            grantPermissions(Role, [P.VIEW_MEDICAL_RECORD], 'Patient');
            const { caller } = callerFor(USERS.patient);

            await caller.medicalRecord.getMedicalRecords({ patientId: 'PAT-000099', doctorId: 'EMP-000002' });

            expect(MedicalRecord.find).toHaveBeenCalledWith({
                isDeleted: false,
                patientId: USERS.patient.userId,
                status: 'Completed',
            });
        });

        it.each([
            [{ page: 0 }, 'Page must be a positive integer'],
            [{ limit: 101 }, 'Limit must be between 1 and 100'],
        ])('rejects invalid pagination %j', async (input, message) => {
            const { caller } = callerFor(USERS.doctor);

            const error = await expectTRPCError(caller.medicalRecord.getMedicalRecords(input), 'BAD_REQUEST');

            expect(error.cause.issues.map((issue) => issue.message)).toContain(message);
        });
    });

    describe('getMedicalRecordById', () => {
        it('returns the record', async () => {
            MedicalRecord.findOne.mockReturnValue(query(record));
            const { caller } = callerFor(USERS.doctor);

            await expect(caller.medicalRecord.getMedicalRecordById({ medicalRecordId: 'REC-000001' })).resolves.toMatchObject({
                medicalRecordId: 'REC-000001',
            });
        });

        it('maps a missing record to NOT_FOUND', async () => {
            MedicalRecord.findOne.mockReturnValue(query(null));
            const { caller } = callerFor(USERS.doctor);

            await expectTRPCError(
                caller.medicalRecord.getMedicalRecordById({ medicalRecordId: 'REC-9' }),
                'NOT_FOUND',
                ERROR_MESSAGES.MEDICAL_RECORD_NOT_FOUND,
            );
        });

        it("does not let a patient read someone else's record", async () => {
            grantPermissions(Role, [P.VIEW_MEDICAL_RECORD], 'Patient');
            MedicalRecord.findOne.mockReturnValue(query({ ...record, patientId: 'PAT-000099' }));
            const { caller } = callerFor(USERS.patient);

            await expectTRPCError(
                caller.medicalRecord.getMedicalRecordById({ medicalRecordId: 'REC-000001' }),
                'FORBIDDEN',
                ERROR_MESSAGES.ACCESS_DENIED,
            );
        });

        it('hides draft records from the patient', async () => {
            grantPermissions(Role, [P.VIEW_MEDICAL_RECORD], 'Patient');
            MedicalRecord.findOne.mockReturnValue(query({ ...record, status: 'Draft' }));
            const { caller } = callerFor(USERS.patient);

            await expectTRPCError(
                caller.medicalRecord.getMedicalRecordById({ medicalRecordId: 'REC-000001' }),
                'NOT_FOUND',
            );
        });
    });

    describe('createMedicalRecord', () => {
        const complete = { ...relations, complaint: 'Fever', symptoms: 'Cough', diagnosis: 'Flu' };

        beforeEach(() => {
            User.exists.mockResolvedValue({ _id: 1 });
            Patient.exists.mockResolvedValue({ _id: 1 });
            Appointment.exists.mockResolvedValue({ _id: 1 });
            MedicalRecord.exists.mockResolvedValue(null);
            MedicalRecord.create.mockResolvedValue({ medicalRecordId: 'REC-000007' });
        });

        it('stamps createdBy from the token, not from the client', async () => {
            const { caller } = callerFor(USERS.doctor);

            const result = await caller.medicalRecord.createMedicalRecord({ ...complete, createdBy: 'EMP-FORGED' });

            expect(result).toEqual({ message: SUCCESS_MESSAGES.MEDICAL_RECORD_CREATED, medicalRecordId: 'REC-000007' });
            expect(MedicalRecord.create).toHaveBeenCalledWith(expect.objectContaining({ createdBy: USERS.doctor.userId }));
        });

        it('requires the clinical fields unless the record is a draft', async () => {
            const { caller } = callerFor(USERS.doctor);

            const error = await expectTRPCError(caller.medicalRecord.createMedicalRecord(relations), 'BAD_REQUEST');

            expect(error.cause.issues.map((issue) => issue.message)).toEqual(
                expect.arrayContaining(['complaint is required', 'symptoms are required', 'diagnosis is required']),
            );
        });

        it('accepts an incomplete draft', async () => {
            const { caller } = callerFor(USERS.doctor);

            await expect(caller.medicalRecord.createMedicalRecord({ ...relations, status: 'Draft' })).resolves.toBeDefined();
        });

        it('rejects a duplicate record with CONFLICT', async () => {
            MedicalRecord.exists.mockResolvedValue({ _id: 1 });
            const { caller } = callerFor(USERS.doctor);

            await expectTRPCError(caller.medicalRecord.createMedicalRecord(complete), 'CONFLICT', ERROR_MESSAGES.MEDICAL_RECORD_EXISTS);
        });

        it('fails when the appointment does not belong to the doctor and patient', async () => {
            Appointment.exists.mockResolvedValue(null);
            const { caller } = callerFor(USERS.doctor);

            await expectTRPCError(caller.medicalRecord.createMedicalRecord(complete), 'NOT_FOUND', ERROR_MESSAGES.APPOINTMENT_NOT_FOUND);
        });
    });

    describe('deleteMedicalRecord', () => {
        it('soft deletes on behalf of the caller', async () => {
            MedicalRecord.findOneAndUpdate.mockResolvedValue(record);
            const { caller } = callerFor(USERS.doctor);

            const result = await caller.medicalRecord.deleteMedicalRecord({ medicalRecordId: 'REC-000001' });

            expect(result.message).toBe(SUCCESS_MESSAGES.MEDICAL_RECORD_DELETED);
            expect(MedicalRecord.findOneAndUpdate).toHaveBeenCalledWith(
                { medicalRecordId: 'REC-000001', isDeleted: false },
                expect.objectContaining({ isDeleted: true, deletedBy: USERS.doctor.userId }),
            );
        });

        it('returns NOT_FOUND for an unknown or already deleted record', async () => {
            MedicalRecord.findOneAndUpdate.mockResolvedValue(null);
            const { caller } = callerFor(USERS.doctor);

            await expectTRPCError(caller.medicalRecord.deleteMedicalRecord({ medicalRecordId: 'REC-9' }), 'NOT_FOUND');
        });
    });
});
