jest.mock('../../src/models/user.model');
jest.mock('../../src/utils/mail.utils', () => ({ sendMail: jest.fn() }));

const request = require('supertest');
const bcrypt = require('bcrypt');

const User = require('../../src/models/user.model');
const app = require('../../src/app');
const { signToken, USERS } = require('./helpers');

const encode = (input) => encodeURIComponent(JSON.stringify(input));

describe('tRPC over HTTP', () => {
    it('serves the health check', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it('answers unknown procedures with 404', async () => {
        const res = await request(app).get('/trpc/getMedicalRecords');

        expect(res.status).toBe(404);
    });

    it('answers 401 when the token is missing', async () => {
        const res = await request(app).get(`/trpc/medicalRecord.getMedicalRecords?input=${encode({ page: 1, limit: 10 })}`);

        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe('Authentication required');
    });

    it('answers 401 for an expired or forged token so clients can refresh', async () => {
        const res = await request(app)
            .get(`/trpc/medicalRecord.getMedicalRecords?input=${encode({})}`)
            .set('Authorization', `Bearer ${signToken(USERS.doctor, 'wrong-secret')}`);

        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe('Invalid or expired token');
    });

    it('answers 400 with field level validation details', async () => {
        const res = await request(app)
            .post('/trpc/auth.login')
            .send({ email: 'nope', password: '1' });

        expect(res.status).toBe(400);
        expect(res.body.error.data.zodError.fieldErrors).toMatchObject({
            email: ['Invalid email format'],
            password: ['Password must contain atleast 8 characters.'],
        });
    });

    it('logs in through POST and sets the refresh cookie', async () => {
        User.findOne.mockResolvedValue({
            email: 'patient@hms.test',
            passwordHash: bcrypt.hashSync('Password1', 4),
            role: 'Patient',
            status: 'Active',
            isVerified: true,
            firstLogin: false,
            patientId: 'PAT-000001',
            save: jest.fn(),
        });

        const res = await request(app).post('/trpc/auth.login').send({ email: 'patient@hms.test', password: 'Password1' });

        expect(res.status).toBe(200);
        expect(res.body.result.data.token).toEqual(expect.any(String));
        expect(res.body.result.data).not.toHaveProperty('refreshToken');
        expect(res.headers['set-cookie'][0]).toMatch(/^refresh_token=.+HttpOnly/i);
    });

    it('returns domain errors with the right status and no stack trace', async () => {
        User.findOne.mockResolvedValue(null);

        const res = await request(app).post('/trpc/auth.login').send({ email: 'ghost@hms.test', password: 'Password1' });

        expect(res.status).toBe(401);
        expect(res.body.error.message).toBe('Invalid credentials');
        expect(res.body.error.data.zodError).toBeNull();
    });

    it('keeps the REST api reachable next to tRPC', async () => {
        const res = await request(app).get('/medicalRecord/getMedicalRecords');

        expect([401, 403, 422]).toContain(res.status);
    });
});
