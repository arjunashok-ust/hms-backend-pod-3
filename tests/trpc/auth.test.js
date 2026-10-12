jest.mock('../../src/models/user.model');
jest.mock('../../src/models/employee.model');
jest.mock('../../src/models/patient.model');
jest.mock('../../src/models/role.model');
jest.mock('../../src/utils/mail.utils', () => ({ sendMail: jest.fn().mockResolvedValue(undefined) }));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../../src/models/user.model');
const Employee = require('../../src/models/employee.model');
const Patient = require('../../src/models/patient.model');
const mail = require('../../src/utils/mail.utils');
const { callerFor, USERS, query, expectTRPCError, signToken } = require('./helpers');
const { ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../../src/constants/messages.constants');

const PASSWORD = 'Password1';

const accountDoc = (overrides = {}) => ({
    email: 'patient@hms.test',
    passwordHash: bcrypt.hashSync(PASSWORD, 4),
    role: 'Patient',
    status: 'Active',
    isVerified: true,
    firstLogin: false,
    patientId: 'PAT-000001',
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
});

describe('auth router', () => {
    describe('login', () => {
        it('returns the session and keeps the refresh token in an httpOnly cookie', async () => {
            const user = accountDoc();
            User.findOne.mockResolvedValue(user);
            const { caller, res } = callerFor(null);

            const result = await caller.auth.login({ email: ' Patient@HMS.test ', password: PASSWORD });

            expect(User.findOne).toHaveBeenCalledWith({ email: 'patient@hms.test', isDeleted: false });
            expect(result).toEqual({
                message: SUCCESS_MESSAGES.LOGIN,
                email: 'patient@hms.test',
                token: expect.any(String),
                role: 'Patient',
                status: 'Active',
                firstLogin: false,
            });
            expect(result).not.toHaveProperty('refreshToken');
            expect(jwt.verify(result.token, process.env.ACCESS_TOKEN_SECRET)).toMatchObject({ userId: 'PAT-000001', role: 'Patient' });

            expect(res.cookie).toHaveBeenCalledWith('refresh_token', user.refresh_token, expect.objectContaining({ httpOnly: true }));
            expect(user.save).toHaveBeenCalled();
        });

        it('does not reveal whether the email or the password was wrong', async () => {
            const { caller } = callerFor(null);

            User.findOne.mockResolvedValue(null);
            await expectTRPCError(caller.auth.login({ email: 'x@hms.test', password: PASSWORD }), 'UNAUTHORIZED', ERROR_MESSAGES.INVALID_CREDENTIALS);

            User.findOne.mockResolvedValue(accountDoc());
            await expectTRPCError(caller.auth.login({ email: 'patient@hms.test', password: 'WrongPass1' }), 'UNAUTHORIZED', ERROR_MESSAGES.INVALID_CREDENTIALS);
        });

        it.each([
            [{ isVerified: false }, ERROR_MESSAGES.EMAIL_NOT_VERIFIED],
            [{ status: 'Pending' }, ERROR_MESSAGES.ACCOUNT_NOT_ACTIVATED],
        ])('blocks an account in state %j', async (overrides, message) => {
            User.findOne.mockResolvedValue(accountDoc(overrides));
            const { caller } = callerFor(null);

            await expectTRPCError(caller.auth.login({ email: 'patient@hms.test', password: PASSWORD }), 'BAD_REQUEST', message);
        });

        it('keeps staff out of the mobile app', async () => {
            User.findOne.mockResolvedValue(accountDoc({ role: 'Doctor', employeeId: 'EMP-000002' }));
            const { caller } = callerFor(null);

            await expectTRPCError(
                caller.auth.login({ email: 'patient@hms.test', password: PASSWORD, isClientApp: true }),
                'FORBIDDEN',
                ERROR_MESSAGES.CLIENT_MOBILE_APP,
            );
        });

        it('validates the payload before touching the database', async () => {
            const { caller } = callerFor(null);

            const error = await expectTRPCError(caller.auth.login({ email: 'not-an-email', password: 'short' }), 'BAD_REQUEST');

            expect(error.cause.issues.map((issue) => issue.message)).toEqual(
                expect.arrayContaining(['Invalid email format', 'Password must contain atleast 8 characters.']),
            );
            expect(User.findOne).not.toHaveBeenCalled();
        });
    });

    describe('refreshToken', () => {
        const refreshToken = signToken({ userId: 'PAT-000001' }, process.env.REFRESH_TOKEN_SECRET);

        it('rotates the refresh token and issues a new access token', async () => {
            const user = accountDoc({ refresh_token: refreshToken });
            User.findOne.mockResolvedValue(user);
            const { caller, res } = callerFor(null, { cookies: { refresh_token: refreshToken } });

            const result = await caller.auth.refreshToken();

            expect(jwt.verify(result.token, process.env.ACCESS_TOKEN_SECRET).userId).toBe('PAT-000001');
            expect(res.cookie).toHaveBeenCalledWith('refresh_token', user.refresh_token, expect.any(Object));
            expect(user.save).toHaveBeenCalled();
        });

        it('requires the cookie', async () => {
            const { caller } = callerFor(null);

            await expectTRPCError(caller.auth.refreshToken(), 'UNAUTHORIZED', ERROR_MESSAGES.TOKEN_NOT_FOUND);
        });

        it('rejects a token that was already rotated', async () => {
            User.findOne.mockResolvedValue(null);
            const { caller } = callerFor(null, { cookies: { refresh_token: refreshToken } });

            await expectTRPCError(caller.auth.refreshToken(), 'UNAUTHORIZED', ERROR_MESSAGES.TOKEN_INVALID_OR_EXPIRED);
        });

        it('rejects a forged token without querying the database', async () => {
            const { caller } = callerFor(null, { cookies: { refresh_token: signToken({ userId: 'x' }, 'wrong-secret') } });

            await expectTRPCError(caller.auth.refreshToken(), 'UNAUTHORIZED', ERROR_MESSAGES.TOKEN_INVALID_OR_EXPIRED);
            expect(User.findOne).not.toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('invalidates the stored refresh token and clears the cookie', async () => {
            User.updateOne.mockResolvedValue({ matchedCount: 1 });
            const { caller, res } = callerFor(USERS.patient);

            const result = await caller.auth.logout();

            expect(result.message).toBe(SUCCESS_MESSAGES.LOGOUT);
            expect(User.updateOne).toHaveBeenCalledWith(expect.any(Object), { refresh_token: null });
            expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
        });
    });

    describe('setPassword', () => {
        it('uses the email from the token and only works on first login', async () => {
            const user = accountDoc({ firstLogin: true });
            User.findOne.mockResolvedValue(user);
            const { caller } = callerFor(USERS.patient);

            await caller.auth.setPassword({ password: 'NewPassword1', email: 'victim@hms.test' });

            expect(User.findOne).toHaveBeenCalledWith({ email: USERS.patient.email, isDeleted: false });
            expect(user.firstLogin).toBe(false);
            expect(await bcrypt.compare('NewPassword1', user.passwordHash)).toBe(true);
        });

        it('refuses users that already set a password', async () => {
            User.findOne.mockResolvedValue(accountDoc({ firstLogin: false }));
            const { caller } = callerFor(USERS.patient);

            await expectTRPCError(caller.auth.setPassword({ password: 'NewPassword1' }), 'BAD_REQUEST', ERROR_MESSAGES.SET_PASSWORD);
        });
    });

    describe('signUp', () => {
        const employee = {
            name: 'Jane Doe',
            email: 'Jane@HMS.test',
            password: 'Password1',
            department: 'OPD',
            role: 'Nurse',
            designation: 'Nurse',
            joiningDate: '2026-01-01',
            medicalRegistrationNo: 'MR-1',
        };

        beforeEach(() => {
            User.exists.mockResolvedValue(null);
            Employee.exists.mockResolvedValue(null);
        });

        it('creates the profile and account, then notifies admin and employee', async () => {
            Employee.create.mockResolvedValue({ employeeCode: 'EMP-000010', name: 'Jane Doe', deleteOne: jest.fn() });
            User.create.mockResolvedValue({});
            const { caller } = callerFor(null);

            const result = await caller.auth.signUp(employee);

            expect(result).toEqual({ message: SUCCESS_MESSAGES.ACCOUNT_CREATED, email: 'jane@hms.test' });
            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'jane@hms.test', employeeId: 'EMP-000010', role: 'Nurse', isVerified: false }),
            );
            const recipients = mail.sendMail.mock.calls.map(([message]) => message.to);
            expect(recipients).toEqual(expect.arrayContaining([process.env.ADMIN_MAIL, 'jane@hms.test']));
        });

        it('removes the profile again when the account cannot be created', async () => {
            const profile = { employeeCode: 'EMP-000010', name: 'Jane Doe', deleteOne: jest.fn() };
            Employee.create.mockResolvedValue(profile);
            User.create.mockRejectedValue(new Error('db down'));
            const { caller } = callerFor(null);

            await expect(caller.auth.signUp(employee)).rejects.toThrow();
            expect(profile.deleteOne).toHaveBeenCalled();
        });

        it('does not fail the request when the mail provider is down', async () => {
            Employee.create.mockResolvedValue({ employeeCode: 'EMP-000010', name: 'Jane Doe', deleteOne: jest.fn() });
            User.create.mockResolvedValue({});
            mail.sendMail.mockRejectedValue(new Error('brevo down'));
            const { caller } = callerFor(null);

            await expect(caller.auth.signUp(employee)).resolves.toMatchObject({ message: SUCCESS_MESSAGES.ACCOUNT_CREATED });
            mail.sendMail.mockResolvedValue(undefined);
        });

        it('rejects an email that is already registered', async () => {
            User.exists.mockResolvedValue({ _id: 1 });
            const { caller } = callerFor(null);

            await expectTRPCError(caller.auth.signUp(employee), 'CONFLICT', ERROR_MESSAGES.EMAIL_EXISTS);
        });

        it('enforces the role specific fields and the password policy', async () => {
            const { caller } = callerFor(null);

            const error = await expectTRPCError(
                caller.auth.signUp({ ...employee, role: 'Doctor', medicalRegistrationNo: undefined, password: 'weakpass' }),
                'BAD_REQUEST',
            );

            expect(error.cause.issues.map((issue) => issue.message)).toEqual(
                expect.arrayContaining([
                    'Password must contain a uppercase character',
                    'Password must contain a digit',
                    'Consultation fee is required for doctors.',
                    'Availability slots are required for doctors.',
                    'Medical registration no is required for this role',
                    'Specialization is required for this role',
                ]),
            );
        });
    });

    describe('patientSignUp', () => {
        const patient = {
            name: 'John',
            email: 'john@hms.test',
            password: 'Password1',
            status: 'Active',
            phone: '9999999999',
            gender: 'Male',
            dob: '1990-01-01',
            address: 'Somewhere',
            bloodGroup: 'O+',
        };

        it('rejects a phone number that is already registered', async () => {
            Patient.exists.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: 1 });
            User.exists.mockResolvedValue(null);
            const { caller } = callerFor(null);

            await expectTRPCError(caller.auth.patientSignUp(patient), 'CONFLICT', ERROR_MESSAGES.PHONE_EXISTS);
        });

        it('requires a password for self registration', async () => {
            const { caller } = callerFor(null);

            const error = await expectTRPCError(caller.auth.patientSignUp({ ...patient, password: undefined }), 'BAD_REQUEST');

            expect(error.cause.issues.map((issue) => issue.message)).toContain('Password is required.');
        });
    });

    describe('resetPassword', () => {
        it('answers identically for unknown emails', async () => {
            User.findOne.mockResolvedValue(null);
            const { caller } = callerFor(null);

            await expect(caller.auth.resetPassword({ email: 'ghost@hms.test' })).resolves.toEqual({
                message: SUCCESS_MESSAGES.RESET_LINK_SENT,
            });
            expect(mail.sendMail).not.toHaveBeenCalled();
        });

        it('mails a temporary password to a known user', async () => {
            const user = accountDoc();
            User.findOne.mockResolvedValue(user);
            const { caller } = callerFor(null);

            await caller.auth.resetPassword({ email: 'patient@hms.test' });

            expect(user.firstLogin).toBe(true);
            expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'patient@hms.test' }));
        });
    });

    describe('getPermissions', () => {
        it('rejects an unknown role', async () => {
            const Role = require('../../src/models/role.model');
            Role.findOne.mockReturnValue(query(null));
            const { caller } = callerFor(null);

            await expectTRPCError(caller.auth.getPermissions({ role: 'Nope' }), 'BAD_REQUEST', ERROR_MESSAGES.UNKNOWN_ROLE);
        });
    });
});
