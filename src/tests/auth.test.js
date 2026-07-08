jest.mock('../models/user.model');
jest.mock('../models/employee.model');
jest.mock('../models/patient.model');
jest.mock('../utils/mail.utils');
jest.mock('../utils/tokenGenerator.util');
jest.mock('../config/db.config');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const request = require('supertest');
const bcrypt = require('bcrypt');

const app = require('../app');

const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const mail = require('../utils/mail.utils');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenGenerator.util');

const makeMockUser = (overrides = {}) => ({
    email: 'john@hospital.com',
    passwordHash: 'hashed',
    role: 'Doctor',
    status: 'Active',
    isVerified: true,
    isDeleted: false,
    employeeId: { _id: 'mongo_employee_id' },
    patientId: null,
    firstLogin: false,
    refresh_token: null,
    verification_token: 'valid_token',
    ...overrides,
    save: jest.fn().mockResolvedValue(true),
});

const makeMockEmployee = (overrides = {}) => ({
    _id: 'mongo_employee_id',
    name: 'John Doe',
    email: 'john@hospital.com',
    employeeCode: 'EMP001',
    ...overrides,
});

const makeMockPatient = (overrides = {}) => ({
    _id: 'mongo_patient_id',
    name: 'Alice',
    email: 'alice@example.com',
    uhid: 'UHID001',
    ...overrides,
});


const baseSignUpPayload = {
    name: 'John Doe',
    email: 'john@hospital.com',
    status: 'Active',
    department: 'OPD',
    designation: 'Staff',
    joiningDate: '2023-01-01',
};

const baseLoginPayload = {
    email: 'john@hospital.com',
    password: 'Password1',
};

const basePatientPayload = {
    name: 'Alice',
    role: 'Patient',
    email: 'alice@example.com',
    password: 'Password1',
    status: 'Active',
    phone: '9876543210',
    gender: 'Female',
    dob: '1990-05-20',
    address: '123 Main St',
    bloodGroup: 'A+',
};

describe('POST /auth/signup', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_MAIL = 'admin@hms.com';
        User.findOne.mockResolvedValue(null);
        Employee.findOne.mockResolvedValue(null);
        Employee.create.mockResolvedValue(makeMockEmployee());
        User.create.mockResolvedValue({});
        bcrypt.hash.mockResolvedValue('hashed');
        mail.sendMail.mockResolvedValue(true);
    });

    describe('Role: Doctor', () => {
        const payload = {
            ...baseSignUpPayload,
            role: 'Doctor',
            medicalRegistrationNo: 'MED-000001',
            specialization: 'Cardiology',
            consultationFee: 500,
            availabilitySlots: ["10 : 00 - 10 : 30"],
        };

        it('should return 201 on successful Doctor signup', async () => {
            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(201);
            expect(res.body.email).toBe(payload.email);
        });

        it('should store Doctor specific fields in Employee', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(Employee.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    specialization: 'Cardiology',
                    consultationFee: 500,
                    availabilitySlots: payload.availabilitySlots,
                    medicalRegistrationNo: 'MED-000001',
                })
            );
        });

        it('should check medicalRegistrationNo uniqueness', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(Employee.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ medicalRegistrationNo: 'MED-000001' })
            );
        });

        it('should return 409 when medicalRegistrationNo already exists', async () => {
            Employee.findOne.mockResolvedValue({ medicalRegistrationNo: 'MED-000001' });

            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(409);
        });

        it('should send credentials email when status is Active', async () => {
            await request(app).post('/auth/signup').send(payload);

            const subjects = mail.sendMail.mock.calls.map((c) => c[0].subject);
            expect(subjects).toContain('HMS System | Employee Credentials');
        });

        it('should send verification email', async () => {
            await request(app).post('/auth/signup').send(payload);

            const subjects = mail.sendMail.mock.calls.map((c) => c[0].subject);
            expect(subjects).toContain('HMS System | User Email Verification');
        });

        it('should set firstLogin true when status is Active', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ firstLogin: true })
            );
        });
    });

    describe('Role: Nurse', () => {
        const payload = {
            ...baseSignUpPayload,
            role: 'Nurse',
            department: 'ICU',
            medicalRegistrationNo: 'NUR001',
        };

        it('should return 201 on successful Nurse signup', async () => {
            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(201);
        });

        it('should check medicalRegistrationNo uniqueness', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(Employee.findOne).toHaveBeenCalledWith(
                expect.objectContaining({ medicalRegistrationNo: 'NUR001' })
            );
        });

        it('should return 409 when medicalRegistrationNo already exists', async () => {
            Employee.findOne.mockResolvedValue({ medicalRegistrationNo: 'NUR001' });

            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(409);
        });
    });

    describe('Role: Pharmacist', () => {
        const payload = {
            ...baseSignUpPayload,
            role: 'Pharmacist',
            department: 'Pharmacy',
            medicalRegistrationNo: 'PHA001',
        };

        it('should return 201 on successful Pharmacist signup', async () => {
            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(201);
        });

        it('should return 409 when medicalRegistrationNo already exists', async () => {
            Employee.findOne.mockResolvedValue({ medicalRegistrationNo: 'PHA001' });

            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(409);
        });
    });

    describe('Role: Receptionist', () => {
        const payload = {
            ...baseSignUpPayload,
            role: 'Receptionist',
            department: 'OPD',
        };

        it('should return 201 on successful Receptionist signup', async () => {
            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(201);
        });

        it('should NOT check medicalRegistrationNo for Receptionist', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(Employee.findOne).not.toHaveBeenCalled();
        });
    });

    describe('Common error cases', () => {
        const payload = {
            ...baseSignUpPayload,
            role: 'Doctor',
            medicalRegistrationNo: 'MED-000001',
            specialization: 'Cardiology',
            consultationFee: 500,
            availabilitySlots: ["10 : 00 - 10 : 30"],
        };

        it('should return 409 when email already exists', async () => {
            User.findOne.mockResolvedValue(makeMockUser());

            const res = await request(app).post('/auth/signup').send(payload);

            expect(res.status).toBe(409);
        });

        it('should hash password before storing', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 12);
        });

        it('should store role correctly in User record', async () => {
            await request(app).post('/auth/signup').send(payload);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'Doctor' })
            );
        });
    });
});

describe('POST /auth/login', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        User.findOne.mockResolvedValue(makeMockUser());
        bcrypt.compare.mockResolvedValue(true);
        generateAccessToken.mockReturnValue('access_token');
        generateRefreshToken.mockReturnValue('refresh_token');
    });

    describe('Success scenarios', () => {
        it('should return 200 with access token on valid credentials', async () => {
            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.status).toBe(200);
            expect(res.body.token).toBe('access_token');
        });

        it('should return email, role and status in response', async () => {
            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.body.email).toBe('john@hospital.com');
            expect(res.body.role).toBe('Doctor');
            expect(res.body.status).toBe('Active');
        });

        it('should return firstLogin flag in response', async () => {
            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.body).toHaveProperty('firstLogin');
        });

        it('should return firstLogin true for first time users', async () => {
            User.findOne.mockResolvedValue(makeMockUser({ firstLogin: true }));

            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.body.firstLogin).toBe(true);
        });

        it('should set refresh_token as httpOnly cookie', async () => {
            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'][0]).toMatch(/refresh_token/);
            expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
        });

        it('should save refresh_token to user record', async () => {
            const user = makeMockUser();
            User.findOne.mockResolvedValue(user);

            await request(app).post('/auth/login').send(baseLoginPayload);

            expect(user.refresh_token).toBe('refresh_token');
            expect(user.save).toHaveBeenCalled();
        });

        it('should allow Patient to login via client app', async () => {
            User.findOne.mockResolvedValue(
                makeMockUser({ role: 'Patient', patientId: { _id: 'mongo_patient_id' }, employeeId: null })
            );

            const res = await request(app)
                .post('/auth/login')
                .send({ ...baseLoginPayload, isClientApp: true });

            expect(res.status).toBe(200);
        });

        it('should allow Patient to login via web', async () => {
            User.findOne.mockResolvedValue(
                makeMockUser({ role: 'Patient', patientId: { _id: 'mongo_patient_id' }, employeeId: null })
            );

            const res = await request(app)
                .post('/auth/login')
                .send({ ...baseLoginPayload, isClientApp: false });

            expect(res.status).toBe(200);
        });
    });

    describe('Credential failures', () => {
        it('should return 401 when user does not exist', async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.status).toBe(401);
        });

        it('should return 401 when password is wrong', async () => {
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.status).toBe(401);
        });

        it('should return 401 when user is soft deleted', async () => {
            User.findOne.mockResolvedValue(null);

            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.status).toBe(401);
        });
    });

    describe('Account state failures', () => {
        it('should return 400 when email is not verified', async () => {
            User.findOne.mockResolvedValue(makeMockUser({ isVerified: false }));

            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.status).toBe(400);
        });


        it('should return 400 when account status is Pending', async () => {
            User.findOne.mockResolvedValue(makeMockUser({ status: 'Pending' }));

            const res = await request(app).post('/auth/login').send(baseLoginPayload);

            expect(res.status).toBe(400);
        });
    });

    describe('Client app restrictions', () => {
        const nonPatientRoles = ['Doctor', 'Admin', 'Nurse', 'Pharmacist', 'LabTech', 'Receptionist', 'Cashier'];

        nonPatientRoles.forEach((role) => {
            it(`should return 403 when ${role} tries to login via client app`, async () => {
                User.findOne.mockResolvedValue(makeMockUser({ role }));

                const res = await request(app)
                    .post('/auth/login')
                    .send({ ...baseLoginPayload, isClientApp: true });

                expect(res.status).toBe(403);
            });
        });
    });
});

describe('POST /auth/patientSignUp', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        Patient.findOne.mockResolvedValue(null);
        Patient.create.mockResolvedValue(makeMockPatient());
        User.create.mockResolvedValue({});
        bcrypt.hash.mockResolvedValue('hashed');
        mail.sendMail.mockResolvedValue(true);
    });

    describe('Success scenarios', () => {
        it('should return 201 on successful patient signup', async () => {
            const res = await request(app)
                .post('/auth/patientSignUp')
                .send(basePatientPayload);

            expect(res.status).toBe(201);
            expect(res.body.email).toBe(basePatientPayload.email);
        });

        it('should create Patient record with correct fields', async () => {
            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            expect(Patient.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Alice',
                    email: 'alice@example.com',
                    phone: '9876543210',
                    gender: 'Female',
                    bloodGroup: 'A+',
                })
            );
        });

        it('should create User with role Patient', async () => {
            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'Patient' })
            );
        });

        it('should set isVerified false on new patient User', async () => {
            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ isVerified: false })
            );
        });

        it('should set User status to Active regardless of payload status', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, status: 'Inactive' });

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'Active' })
            );
        });

        it('should hash the password before storing', async () => {
            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 12);
        });

        it('should send verification email after signup', async () => {
            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            const subjects = mail.sendMail.mock.calls.map((c) => c[0].subject);
            expect(subjects).toContain('HMS System | Patient Email Verification');
        });
    });

    describe('Status: Active (self register)', () => {
        it('should use the provided password', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, status: 'Active' });

            expect(bcrypt.hash).toHaveBeenCalledWith('Password1', 12);
        });

        it('should NOT send credentials email', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, status: 'Active' });

            const subjects = mail.sendMail.mock.calls.map((c) => c[0].subject);
            expect(subjects).not.toContain('HMS App | Patient Credentials');
        });
    });

    describe('Status: Inactive (created by staff)', () => {
        it('should send credentials email with temp password', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, status: 'Inactive' });

            const subjects = mail.sendMail.mock.calls.map((c) => c[0].subject);
            expect(subjects).toContain('HMS App | Patient Credentials');
        });

        it('should send credentials email to correct patient email', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, status: 'Inactive' });

            const credentialsMail = mail.sendMail.mock.calls.find(
                (c) => c[0].subject === 'HMS App | Patient Credentials'
            );
            expect(credentialsMail[0].to).toBe('alice@example.com');
        });

        it('should NOT use the provided password (generate temp instead)', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, status: 'Inactive' });

            expect(bcrypt.hash).not.toHaveBeenCalledWith('Password1', 12);
        });
    });

    describe('Duplicate checks', () => {
        it('should return 409 when email already exists', async () => {
            Patient.findOne.mockResolvedValueOnce(makeMockPatient());

            const res = await request(app)
                .post('/auth/patientSignUp')
                .send(basePatientPayload);

            expect(res.status).toBe(409);
        });

        it('should return 409 when phone already exists', async () => {
            Patient.findOne
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(makeMockPatient());

            const res = await request(app)
                .post('/auth/patientSignUp')
                .send(basePatientPayload);

            expect(res.status).toBe(409);
        });

        it('should check email before phone', async () => {
            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            expect(Patient.findOne).toHaveBeenNthCalledWith(
                1, expect.objectContaining({ email: 'alice@example.com' })
            );
            expect(Patient.findOne).toHaveBeenNthCalledWith(
                2, expect.objectContaining({ phone: '9876543210' })
            );
        });

        it('should NOT create Patient or User when email is duplicate', async () => {
            Patient.findOne.mockResolvedValueOnce(makeMockPatient());

            await request(app).post('/auth/patientSignUp').send(basePatientPayload);

            expect(Patient.create).not.toHaveBeenCalled();
            expect(User.create).not.toHaveBeenCalled();
        });
    });

    describe('Optional fields', () => {
        it('should signup successfully without allergies', async () => {
            const res = await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, allergies: undefined });

            expect(res.status).toBe(201);
        });

        it('should signup successfully without emergencyContact', async () => {
            const res = await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, emergencyContact: undefined });

            expect(res.status).toBe(201);
        });

        it('should pass allergies to Patient.create when provided', async () => {
            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, allergies: ['Penicillin'] });

            expect(Patient.create).toHaveBeenCalledWith(
                expect.objectContaining({ allergies: ['Penicillin'] })
            );
        });

        it('should pass emergencyContact to Patient.create when provided', async () => {
            const emergencyContact = { name: 'Bob', phone: '1234567890' };

            await request(app)
                .post('/auth/patientSignUp')
                .send({ ...basePatientPayload, emergencyContact });

            expect(Patient.create).toHaveBeenCalledWith(
                expect.objectContaining({ emergencyContact })
            );
        });
    });
});