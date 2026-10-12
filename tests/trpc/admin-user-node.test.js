jest.mock('../../src/models/role.model');
jest.mock('../../src/models/user.model');
jest.mock('../../src/models/employee.model');
jest.mock('../../src/models/patient.model');
jest.mock('../../src/models/appointment.model');
jest.mock('../../src/models/medical-record.model');
jest.mock('../../src/models/department.model');
jest.mock('../../src/models/node.model');
jest.mock('../../src/models/specialization.model');

const Role = require('../../src/models/role.model');
const User = require('../../src/models/user.model');
const Employee = require('../../src/models/employee.model');
const Patient = require('../../src/models/patient.model');
const Appointment = require('../../src/models/appointment.model');
const MedicalRecord = require('../../src/models/medical-record.model');
const Node = require('../../src/models/node.model');
const Department = require('../../src/models/department.model');
const { callerFor, USERS, query, grantPermissions, expectTRPCError } = require('./helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../../src/constants/messages.constants');
const { PERMISSIONS: P } = require('../../src/constants/permissions.constants');

describe('admin router', () => {
    beforeEach(() => {
        grantPermissions(Role, Object.values(P), 'Admin');
    });

    describe('getUsers', () => {
        it('never returns credentials or tokens', async () => {
            const q = query([
                {
                    email: 'a@hms.test',
                    status: 'Active',
                    role: 'Doctor',
                    employeeId: 'EMP-000002',
                    passwordHash: 'secret-hash',
                    refresh_token: 'refresh',
                    verification_token: 'verify',
                    reset_token: 'reset',
                },
            ]);
            User.find.mockReturnValue(q);
            const { caller } = callerFor(USERS.admin);

            const users = await caller.admin.getUsers();

            expect(q.select).toHaveBeenCalledWith(expect.stringContaining('-passwordHash'));
            expect(JSON.stringify(users)).not.toMatch(/secret-hash|refresh|verify|reset/);
        });

        it('reports NOT_FOUND when there are none', async () => {
            User.find.mockReturnValue(query([]));
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(caller.admin.getUsers(), 'NOT_FOUND', ERROR_MESSAGES.NO_USERS_FOUND);
        });
    });

    describe('approveUser / rejectUser', () => {
        it('activates a pending account', async () => {
            const user = { employeeId: 'EMP-000005', status: 'Pending', save: jest.fn() };
            User.findOne.mockResolvedValue(user);
            const { caller } = callerFor(USERS.admin);

            const result = await caller.admin.approveUser({ employeeId: 'EMP-000005' });

            expect(result).toEqual({ message: SUCCESS_MESSAGES.ACCOUNT_ACTIVATED, employeeId: 'EMP-000005' });
            expect(user.status).toBe('Active');
        });

        it('refuses to activate an account twice', async () => {
            User.findOne.mockResolvedValue({ employeeId: 'EMP-000005', status: 'Active', save: jest.fn() });
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(caller.admin.approveUser({ employeeId: 'EMP-000005' }), 'BAD_REQUEST', ERROR_MESSAGES.ALREADY_ACTIVATED);
        });

        it('rejects an account', async () => {
            const user = { employeeId: 'EMP-000005', status: 'Pending', save: jest.fn() };
            User.findOne.mockResolvedValue(user);
            const { caller } = callerFor(USERS.admin);

            await caller.admin.rejectUser({ employeeId: 'EMP-000005' });

            expect(user.status).toBe('Inactive');
        });
    });

    describe('deleteUserProfile', () => {
        it('cascades to appointments and records for a doctor, recording who deleted', async () => {
            const user = { role: 'Doctor', updateOne: jest.fn() };
            User.findOne.mockResolvedValue(user);
            Employee.findOneAndUpdate.mockResolvedValue({});
            const { caller } = callerFor(USERS.admin);

            await caller.admin.deleteUserProfile({ employeeId: 'EMP-000002' });

            expect(Appointment.updateMany).toHaveBeenCalledWith(
                { doctorEmployeeId: 'EMP-000002', status: 'Booked' },
                { $set: { status: 'Cancelled' } },
            );
            expect(MedicalRecord.updateMany).toHaveBeenCalledWith(
                { doctorId: 'EMP-000002' },
                { $set: expect.objectContaining({ isDeleted: true, deletedBy: USERS.admin.userId }) },
            );
            expect(user.updateOne).toHaveBeenCalled();
        });

        it('leaves appointments alone for non doctors', async () => {
            User.findOne.mockResolvedValue({ role: 'Nurse', updateOne: jest.fn() });
            Employee.findOneAndUpdate.mockResolvedValue({});
            const { caller } = callerFor(USERS.admin);

            await caller.admin.deleteUserProfile({ employeeId: 'EMP-000003' });

            expect(Appointment.updateMany).not.toHaveBeenCalled();
        });
    });

    describe('updateUserProfile', () => {
        const data = {
            name: 'Jane Doe',
            department: 'OPD',
            designation: 'Doctor',
            joiningDate: '2026-01-01',
            medicalRegistrationNo: 'MR-1',
            qualification: 'MBBS',
            specialization: 'Cardiology',
            consultationFee: '500',
            availabilitySlots: ['09:00'],
        };

        it('only writes the whitelisted profile fields', async () => {
            User.findOne.mockResolvedValue({ role: 'Doctor' });
            Employee.findOneAndUpdate.mockResolvedValue({});
            const { caller } = callerFor(USERS.admin);

            await caller.admin.updateUserProfile({
                employeeId: 'EMP-000002',
                data: { ...data, email: 'hijack@hms.test', role: 'Admin' },
            });

            const [, update] = Employee.findOneAndUpdate.mock.calls[0];
            expect(update).not.toHaveProperty('email');
            expect(update).not.toHaveProperty('role');
            expect(update.consultationFee).toBe(500);
        });

        it("applies the account's role rules, not whatever the client claims", async () => {
            User.findOne.mockResolvedValue({ role: 'Doctor' });
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.admin.updateUserProfile({
                    employeeId: 'EMP-000002',
                    data: { ...data, consultationFee: undefined, availabilitySlots: [] },
                }),
                'UNPROCESSABLE_CONTENT',
            );
        });

        it('requires a qualification for nurses', async () => {
            User.findOne.mockResolvedValue({ role: 'Nurse' });
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.admin.updateUserProfile({
                    employeeId: 'EMP-000003',
                    data: { ...data, consultationFee: undefined, availabilitySlots: undefined, specialization: undefined, qualification: '' },
                }),
                'UNPROCESSABLE_CONTENT',
                ERROR_MESSAGES.QUALIFICATION_REQUIRED,
            );
        });
    });

    describe('updateRole', () => {
        it('replaces the permission list', async () => {
            Role.findOneAndUpdate.mockReturnValue(query({ _id: 'x', role_name: 'Nurse', role_permissions: ['view:profile'] }));
            const { caller } = callerFor(USERS.admin);

            const role = await caller.admin.updateRole({ roleName: 'Nurse', data: { role_permissions: ['view:profile'] } });

            expect(role).toEqual({ _id: 'x', role_name: 'Nurse', role_permissions: ['view:profile'] });
        });

        it('rejects malformed permission strings', async () => {
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.admin.updateRole({ roleName: 'Nurse', data: { role_permissions: ['everything'] } }),
                'BAD_REQUEST',
            );
        });

        it('reports an unknown role', async () => {
            Role.findOneAndUpdate.mockReturnValue(query(null));
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.admin.updateRole({ roleName: 'Ghost', data: { role_permissions: [] } }),
                'NOT_FOUND',
                ERROR_MESSAGES.ROLE_NOT_FOUND,
            );
        });
    });

    describe('getDashboardData', () => {
        it('aggregates the counters', async () => {
            [Employee, User, Patient, Appointment, Department].forEach((model) => model.countDocuments.mockResolvedValue(3));
            const { caller } = callerFor(USERS.admin);

            const data = await caller.admin.getDashboardData();

            expect(Object.keys(data)).toHaveLength(10);
            expect(Object.values(data).every((count) => count === 3)).toBe(true);
        });
    });
});

describe('user router', () => {
    beforeEach(() => {
        grantPermissions(Role, Object.values(P), 'Doctor');
    });

    it('getPatientById throws instead of returning the error', async () => {
        Patient.findOne.mockReturnValue(query(null));
        const { caller } = callerFor(USERS.doctor);

        await expectTRPCError(caller.user.getPatientById({ patientId: 'PAT-9' }), 'NOT_FOUND', ERROR_MESSAGES.PATIENT_NOT_FOUND);
    });

    it('getDoctorById throws instead of returning the error', async () => {
        Employee.findOne.mockReturnValue(query(null));
        const { caller } = callerFor(USERS.doctor);

        await expectTRPCError(caller.user.getDoctorById({ doctorId: 'EMP-9' }), 'NOT_FOUND', ERROR_MESSAGES.DOCTOR_NOT_FOUND);
    });

    it("keeps patients out of other patients' profiles", async () => {
        grantPermissions(Role, [P.VIEW_PROFILE, P.VIEW_PATIENT], 'Patient');
        const { caller } = callerFor(USERS.patient);

        await expectTRPCError(caller.user.getPatientProfile({ email: 'someone@else.test' }), 'FORBIDDEN');
        await expectTRPCError(caller.user.getPatientById({ patientId: 'PAT-000099' }), 'FORBIDDEN');
        await expectTRPCError(caller.user.getPatientId({ email: 'someone@else.test' }), 'FORBIDDEN');
    });

    it('keeps patients out of employee profiles', async () => {
        grantPermissions(Role, [P.VIEW_PROFILE], 'Patient');
        const { caller } = callerFor(USERS.patient);

        await expectTRPCError(caller.user.getUserProfile({ email: 'doctor@hms.test' }), 'FORBIDDEN');
    });

    it('lets a patient read their own profile', async () => {
        grantPermissions(Role, [P.VIEW_PATIENT], 'Patient');
        User.findOne.mockReturnValue(query({ email: 'patient@hms.test', status: 'Active', role: 'Patient', isVerified: true }));
        Patient.findOne.mockReturnValue(query({ uhid: 'PAT-000001', name: 'John', gender: 'Male', passwordHash: 'x' }));
        const { caller } = callerFor(USERS.patient);

        await expect(caller.user.getPatientProfile({ email: 'PATIENT@hms.test' })).resolves.toMatchObject({ uhid: 'PAT-000001', name: 'John' });
    });

    it('getPatients counts with the same filter as the page', async () => {
        Patient.countDocuments.mockResolvedValue(0);
        Patient.find.mockReturnValue(query([]));
        const { caller } = callerFor(USERS.doctor);

        await caller.user.getPatients({ selectedText: 'john' });

        expect(Patient.countDocuments).toHaveBeenCalledWith({ isDeleted: false, $text: { $search: 'john' } });
    });

    it('searches escape regex characters', async () => {
        const q = query([]);
        Patient.find.mockReturnValue(q);
        const { caller } = callerFor(USERS.doctor);

        await caller.user.getPatientsBySearch({ searchText: '.*(' });

        const [{ $or }] = Patient.find.mock.calls[0];
        expect($or[0].uhid.$regex).toBe(String.raw`\.\*\(`);
        expect(q.limit).toHaveBeenCalledWith(50);
    });

    it('updatePatientProfile only writes the provided fields', async () => {
        Patient.findOneAndUpdate.mockResolvedValue({});
        const { caller } = callerFor(USERS.doctor);

        await caller.user.updatePatientProfile({ patientId: 'PAT-000001', allergies: 'Peanuts' });

        expect(Patient.findOneAndUpdate).toHaveBeenCalledWith(
            { uhid: 'PAT-000001', isDeleted: false },
            { allergies: 'Peanuts' },
            expect.objectContaining({ runValidators: true }),
        );
    });
});

describe('node router', () => {
    beforeEach(() => {
        grantPermissions(Role, Object.values(P), 'Admin');
    });

    const node = { order: 1, name: 'Home', path: '/home', role: ['Admin'], icon: 'home' };

    it('getNodes requires a known role', async () => {
        Role.exists.mockResolvedValue(null);
        const { caller } = callerFor(USERS.admin);

        await expectTRPCError(caller.node.getNodes({ role: 'Ghost' }), 'BAD_REQUEST', ERROR_MESSAGES.UNKNOWN_ROLE);
    });

    it('createNode refuses duplicate names', async () => {
        Node.exists.mockResolvedValue({ _id: 1 });
        const { caller } = callerFor(USERS.admin);

        await expectTRPCError(caller.node.createNode(node), 'CONFLICT', ERROR_MESSAGES.NODE_EXISTS);
    });

    it('createNode validates the payload', async () => {
        const { caller } = callerFor(USERS.admin);

        await expectTRPCError(caller.node.createNode({ ...node, role: [], path: '' }), 'BAD_REQUEST');
    });

    it('createNode returns the new node', async () => {
        Node.exists.mockResolvedValue(null);
        Node.create.mockResolvedValue({ toObject: () => ({ _id: 'n1', ...node }) });
        const { caller } = callerFor(USERS.admin);

        await expect(caller.node.createNode(node)).resolves.toEqual({ _id: 'n1', ...node });
    });

    it('deleteNode reports an unknown node', async () => {
        Node.findOneAndDelete.mockResolvedValue(null);
        const { caller } = callerFor(USERS.admin);

        await expectTRPCError(caller.node.deleteNode({ nodeName: 'Ghost' }), 'NOT_FOUND', ERROR_MESSAGES.NODE_NOT_FOUND);
    });
});
