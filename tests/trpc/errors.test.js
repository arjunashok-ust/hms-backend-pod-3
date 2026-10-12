jest.mock('../../src/models/role.model');
jest.mock('../../src/models/node.model');

const Role = require('../../src/models/role.model');
const Node = require('../../src/models/node.model');
const { toTRPCError } = require('../../src/trpc/errors');
const AppError = require('../../src/utils/appError.utils');
const { callerFor, USERS, query, grantPermissions, expectTRPCError } = require('./helpers');
const { ERROR_MESSAGES } = require('../../src/constants/messages.constants');
const { PERMISSIONS: P } = require('../../src/constants/permissions.constants');

describe('error mapping', () => {
    it.each([
        [400, 'BAD_REQUEST'],
        [401, 'UNAUTHORIZED'],
        [403, 'FORBIDDEN'],
        [404, 'NOT_FOUND'],
        [409, 'CONFLICT'],
        [422, 'UNPROCESSABLE_CONTENT'],
        [500, 'INTERNAL_SERVER_ERROR'],
        [undefined, 'INTERNAL_SERVER_ERROR'],
    ])('maps AppError status %s to %s', (status, code) => {
        const error = toTRPCError(new AppError('boom', status));
        expect(error.code).toBe(code);
        expect(error.message).toBe('boom');
    });

    it('maps a mongo duplicate key error to CONFLICT with a safe message', () => {
        const error = toTRPCError(Object.assign(new Error('E11000 dup key {email: "x"}'), { code: 11000 }));
        expect(error.code).toBe('CONFLICT');
        expect(error.message).toBe(ERROR_MESSAGES.DUPLICATE_ENTRY);
    });

    it.each(['ValidationError', 'CastError'])('maps a mongoose %s to BAD_REQUEST', (name) => {
        expect(toTRPCError(Object.assign(new Error('bad'), { name })).code).toBe('BAD_REQUEST');
    });

    it('leaves unknown errors for tRPC to report as INTERNAL_SERVER_ERROR', () => {
        expect(toTRPCError(new Error('bug'))).toBeUndefined();
    });

    describe('through the router', () => {
        beforeEach(() => grantPermissions(Role, Object.values(P), 'Admin'));

        it('surfaces a duplicate key from the database as CONFLICT', async () => {
            Node.exists.mockResolvedValue(null);
            Node.create.mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(
                caller.node.createNode({ order: 1, name: 'Home', path: '/home', role: ['Admin'], icon: 'home' }),
                'CONFLICT',
                ERROR_MESSAGES.DUPLICATE_ENTRY,
            );
        });

        it('reports an unexpected failure as INTERNAL_SERVER_ERROR', async () => {
            Role.find.mockReturnValue({ lean: () => Promise.reject(new Error('connection lost')) });
            const { caller } = callerFor(USERS.admin);

            await expectTRPCError(caller.ui.getRoles(), 'INTERNAL_SERVER_ERROR');
        });

        it('validates output so internal fields cannot leak', async () => {
            Role.find.mockReturnValue(query([{ _id: 'r1', role_name: 'Doctor', role_permissions: ['x'], secret: 'nope' }]));
            const { caller } = callerFor(null);

            const roles = await caller.ui.getRoles();

            expect(roles).toEqual([{ _id: 'r1', role_name: 'Doctor' }]);
        });
    });
});
