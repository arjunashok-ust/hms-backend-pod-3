const { initTRPC, TRPCError } = require('@trpc/server');
const jwt = require('jsonwebtoken');
const { ZodError, flattenError } = require('zod');

const Role = require('../models/role.model');
const AppError = require('../utils/appError.utils');

// Context: runs on every request. Same JWT logic as auth.middleware.js,
// but it never throws, because public procedures must still work without a token.
const createContext = ({ req, res }) => {
    let user = null;
    const header = req.headers.authorization;

    if (header?.startsWith('Bearer ')) {
        try {
            user = jwt.verify(header.split(' ')[1], process.env.ACCESS_TOKEN_SECRET);
        } catch {
            user = null;
        }
    }
    return { req, res, user };
};

const t = initTRPC.context().create({
    // Sends Zod validation details to the client in a predictable place
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof ZodError ? flattenError(error.cause) : null,
            },
        };
    },
});

// AppError.statusCode -> tRPC code, so raw Express-style errors never reach the client
const STATUS_TO_CODE = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
};

const mapAppErrors = t.middleware(async ({ next }) => {
    const result = await next();
    if (!result.ok && result.error.cause instanceof AppError) {
        const appErr = result.error.cause;
        throw new TRPCError({
            code: STATUS_TO_CODE[appErr.statusCode] ?? 'INTERNAL_SERVER_ERROR',
            message: appErr.message,
            cause: appErr,
        });
    }
    return result;
});

// Equivalent of auth.middleware.js
const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
});

// Equivalent of permission.middleware.js
const requirePermission = (...required) =>
    t.middleware(async ({ ctx, next }) => {
        const role = await Role.findOne({ role_name: ctx.user.role });
        if (!role) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Role not found.' });
        }
        const allowed = required.flat().some((p) => role.role_permissions.includes(p));
        if (!allowed) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not authorized to perform this action.' });
        }
        return next();
    });

const publicProcedure = t.procedure.use(mapAppErrors);
const protectedProcedure = publicProcedure.use(isAuthed);

module.exports = {
    createContext,
    router: t.router,
    publicProcedure,
    protectedProcedure,
    requirePermission,
    createCallerFactory: t.createCallerFactory,
};
