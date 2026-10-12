const { z } = require('zod');
const { VALIDATION_MESSAGES: V } = require('../../constants/messages.constants');
const { PAGINATION } = require('../../constants/app.constants');

// non-empty trimmed string with a single message for "missing" and "blank"
const requiredString = (message) => z.string({ error: message }).trim().min(1, message);

const emailSchema = z
    .string({ error: V.EMAIL_REQUIRED })
    .trim()
    .toLowerCase()
    .pipe(z.email(V.EMAIL_INVALID));

const passwordSchema = z
    .string({ error: V.PASSWORD_REQUIRED })
    .min(8, V.PASSWORD_MIN_LENGTH);

// stricter rule used when a user picks their own password at sign up
const newPasswordSchema = passwordSchema
    .regex(/[A-Z]/, V.PASSWORD_UPPERCASE)
    .regex(/\d/, V.PASSWORD_DIGIT);

// numeric form fields may arrive as strings; blank means "not provided"
const optionalNumber = (message) =>
    z.preprocess((value) => (value === '' || value === null ? undefined : value), z.coerce.number({ error: message }).optional());

const dateSchema = (message = V.DATE_INVALID) => z.coerce.date({ error: message });

const paginationInput = z.object({
    page: z.number({ error: V.PAGE_INVALID }).int(V.PAGE_INVALID).min(1, V.PAGE_INVALID).default(PAGINATION.DEFAULT_PAGE),
    limit: z
        .number({ error: V.LIMIT_INVALID })
        .int(V.LIMIT_INVALID)
        .min(1, V.LIMIT_INVALID)
        .max(PAGINATION.MAX_LIMIT, V.LIMIT_INVALID)
        .default(PAGINATION.DEFAULT_LIMIT),
    selectedText: z.string().trim().optional(),
});

const paginated = (itemSchema) =>
    z.object({
        data: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
    });

const messageOutput = z.object({ message: z.string() });

// mongo _id as string, only exposed on lookup lists that clients key by _id
const objectIdSchema = z.any().transform((value) => String(value));

module.exports = {
    requiredString,
    emailSchema,
    passwordSchema,
    newPasswordSchema,
    dateSchema,
    optionalNumber,
    paginationInput,
    paginated,
    messageOutput,
    objectIdSchema,
};
