const { TRPCError } = require('@trpc/server');
const AppError = require('../utils/appError.utils');
const ERR = require('../utils/errors.utils');
const { ERROR_MESSAGES } = require('../constants/messages.constants');

const STATUS_TO_CODE = Object.freeze({
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_CONTENT',
});

const MONGO_DUPLICATE_KEY = 11000;

// Converts anything thrown by a service into a TRPCError, so raw errors (mongoose, driver, bugs)
// never reach the client. Returns undefined for errors that are already TRPCErrors.
const toTRPCError = (cause) => {
    if (cause instanceof AppError) {
        return new TRPCError({
            code: STATUS_TO_CODE[cause.statusCode] ?? 'INTERNAL_SERVER_ERROR',
            message: cause.message,
            cause,
        });
    }

    if (cause?.code === MONGO_DUPLICATE_KEY) {
        const duplicate = ERR.duplicateEntry();
        return new TRPCError({ code: 'CONFLICT', message: duplicate.message, cause });
    }

    if (cause?.name === 'ValidationError' || cause?.name === 'CastError') {
        return new TRPCError({ code: 'BAD_REQUEST', message: cause.message, cause });
    }

    return undefined;
};

const INTERNAL_ERROR_MESSAGE = ERROR_MESSAGES.INTERNAL_SERVER_ERROR;

module.exports = { toTRPCError, STATUS_TO_CODE, INTERNAL_ERROR_MESSAGE };
