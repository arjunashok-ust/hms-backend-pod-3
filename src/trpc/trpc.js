const { initTRPC, TRPCError } = require('@trpc/server');
const { ZodError, flattenError } = require('zod');

const Role = require('../models/role.model');
const ERR = require('../utils/errors.utils');
const { isPatient } = require('../utils/access.utils');
const { toTRPCError, INTERNAL_ERROR_MESSAGE } = require('./errors');

const isProduction = process.env.NODE_ENV === 'production';

const t = initTRPC.context().create({
    isDev: !isProduction,
    errorFormatter({ shape, error }) {
        const isInternal = error.code === 'INTERNAL_SERVER_ERROR';
        return {
            ...shape,
            // internal failures are logged by the handler, clients only get a generic message
            message: isInternal && isProduction ? INTERNAL_ERROR_MESSAGE : shape.message,
            data: {
                ...shape.data,
                zodError: error.code === 'BAD_REQUEST' && error.cause instanceof ZodError ? flattenError(error.cause) : null,
            },
        };
    },
});

// Runs first on every procedure: services throw AppError / mongoose errors, clients get TRPCErrors.
const mapErrors = t.middleware(async ({ next }) => {
    const result = await next();
    if (!result.ok) {
        const mapped = toTRPCError(result.error.cause);
        if (mapped) throw mapped;
    }
    return result;
});

const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw toTRPCError(ctx.authError === 'invalid' ? ERR.sessionExpired() : ERR.unauthenticated());
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

// patients must not reach back-office procedures even if their role carries a matching permission
const staffOnly = t.middleware(({ ctx, next }) => {
    if (isPatient(ctx.user)) throw toTRPCError(ERR.accessDenied());
    return next();
});

// passes when the caller's role holds at least one of the permissions (same rule as permission.middleware.js)
const hasPermission = (...required) =>
    t.middleware(async ({ ctx, next }) => {
        const role = await Role.findOne({ role_name: ctx.user.role }).lean();
        if (!role) throw new TRPCError({ code: 'FORBIDDEN', message: ERR.roleNotFound().message });

        const allowed = required.flat().some((permission) => role.role_permissions.includes(permission));
        if (!allowed) throw toTRPCError(ERR.accessDenied());

        return next();
    });

const publicProcedure = t.procedure.use(mapErrors);
const protectedProcedure = publicProcedure.use(isAuthed);

// signed in + holds one of the permissions
const permissionProcedure = (...permissions) => protectedProcedure.use(hasPermission(...permissions));

// back-office only: signed in, not a patient, holds one of the permissions
const staffProcedure = (...permissions) => protectedProcedure.use(staffOnly).use(hasPermission(...permissions));

module.exports = {
    router: t.router,
    createCallerFactory: t.createCallerFactory,
    publicProcedure,
    protectedProcedure,
    permissionProcedure,
    staffProcedure,
};
