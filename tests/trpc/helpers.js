const jwt = require('jsonwebtoken');
const { appRouter } = require('../../src/trpc');
const { createCallerFactory } = require('../../src/trpc/trpc');
const { createContext } = require('../../src/trpc/context');

const createCaller = createCallerFactory(appRouter);

const signToken = (payload, secret = process.env.ACCESS_TOKEN_SECRET) => jwt.sign(payload, secret, { expiresIn: '15m' });

const USERS = {
    admin: { userId: 'EMP-000001', email: 'admin@hms.test', role: 'Admin' },
    doctor: { userId: 'EMP-000002', email: 'doctor@hms.test', role: 'Doctor' },
    patient: { userId: 'PAT-000001', email: 'patient@hms.test', role: 'Patient' },
};

const mockRes = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });

// caller as the express adapter would build it: the context goes through the real createContext
const callerFor = (user, { cookies = {}, token } = {}) => {
    const authorization = token ?? (user ? `Bearer ${signToken(user)}` : undefined);
    const res = mockRes();
    const ctx = createContext({ req: { headers: { authorization }, cookies }, res });
    return { caller: createCaller(ctx), res };
};

// chainable stand-in for a mongoose query: supports select/sort/skip/limit/lean and is awaitable
const query = (result) => {
    const q = {
        select: jest.fn(() => q),
        sort: jest.fn(() => q),
        skip: jest.fn(() => q),
        limit: jest.fn(() => q),
        lean: jest.fn(() => q),
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return q;
};

// makes role lookups return a role holding exactly these permissions
const grantPermissions = (Role, permissions, roleName = 'Admin') => {
    Role.findOne.mockReturnValue(query({ role_name: roleName, role_permissions: permissions }));
};

const expectTRPCError = async (promise, code, message) => {
    const error = await promise.then(
        () => {
            throw new Error('expected the call to fail');
        },
        (err) => err,
    );
    expect(error.code).toBe(code);
    if (message) expect(error.message).toBe(message);
    return error;
};

module.exports = { callerFor, signToken, USERS, query, grantPermissions, expectTRPCError, createCaller, mockRes };
