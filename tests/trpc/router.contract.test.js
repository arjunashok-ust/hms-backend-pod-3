jest.mock('../../src/models/role.model');
jest.mock('../../src/utils/mail.utils', () => ({ sendMail: jest.fn() }));

const Role = require('../../src/models/role.model');
const { appRouter } = require('../../src/trpc');
const { callerFor, USERS, grantPermissions, expectTRPCError } = require('./helpers');
const { ERROR_MESSAGES } = require('../../src/constants/messages.constants');

const PUBLIC_PROCEDURES = [
    'auth.signUp',
    'auth.patientSignUp',
    'auth.login',
    'auth.refreshToken',
    'auth.verifyEmail',
    'auth.getPermissions',
    'auth.resetPassword',
    'auth.verifyResetPassword',
    'ui.getRoles',
    'ui.getDepartments',
    'ui.getSpecializations',
];

const procedures = Object.entries(appRouter._def.procedures);
const protectedProcedures = procedures.filter(([path]) => !PUBLIC_PROCEDURES.includes(path));

// resolves "admin.getUsers" to caller.admin.getUsers
const invoke = (caller, path, input) => path.split('.').reduce((node, key) => node[key], caller)(input);

describe('router contract', () => {
    it('exposes every REST endpoint (55 procedures)', () => {
        expect(procedures).toHaveLength(55);
    });

    it('declares only the intended procedures as public', () => {
        PUBLIC_PROCEDURES.forEach((path) => expect(appRouter._def.procedures).toHaveProperty([path]));
    });

    describe.each(protectedProcedures.map(([path]) => path))('%s', (path) => {
        it('rejects a request without a token', async () => {
            const { caller } = callerFor(null);
            await expectTRPCError(invoke(caller, path, {}), 'UNAUTHORIZED', ERROR_MESSAGES.AUTH_REQUIRED);
        });

        it('rejects an invalid token', async () => {
            const { caller } = callerFor(null, { token: 'Bearer not-a-jwt' });
            await expectTRPCError(invoke(caller, path, {}), 'UNAUTHORIZED', ERROR_MESSAGES.TOKEN_INVALID_OR_EXPIRED);
        });
    });

    describe('role based access', () => {
        const permissionGuarded = protectedProcedures
            .map(([path]) => path)
            .filter((path) => !['auth.logout', 'auth.setPassword'].includes(path));

        it.each(permissionGuarded)('%s forbids a role without any permission', async (path) => {
            grantPermissions(Role, []);
            const { caller } = callerFor(USERS.doctor);
            await expectTRPCError(invoke(caller, path, {}), 'FORBIDDEN', ERROR_MESSAGES.ACCESS_DENIED);
        });

        it.each(procedures.map(([path]) => path).filter((path) => path.startsWith('admin.')))(
            '%s is closed to patients even with every permission',
            async (path) => {
                Role.findOne.mockClear();
                const { caller } = callerFor(USERS.patient);
                await expectTRPCError(invoke(caller, path, {}), 'FORBIDDEN', ERROR_MESSAGES.ACCESS_DENIED);
                expect(Role.findOne).not.toHaveBeenCalled();
            },
        );

        it('reports an unknown role as forbidden', async () => {
            Role.findOne.mockReturnValue({ lean: () => Promise.resolve(null) });
            const { caller } = callerFor(USERS.doctor);
            await expectTRPCError(caller.node.getNodes({ role: 'Doctor' }), 'FORBIDDEN', ERROR_MESSAGES.ROLE_NOT_FOUND);
        });
    });
});
