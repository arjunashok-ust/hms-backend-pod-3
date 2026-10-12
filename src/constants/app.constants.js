const USER_STATUS = Object.freeze({
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending',
});

const APPOINTMENT_STATUS = Object.freeze({
    BOOKED: 'Booked',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    PENDING: 'Pending',
});

const MEDICAL_RECORD_STATUS = Object.freeze({
    DRAFT: 'Draft',
    COMPLETED: 'Completed',
});

const DEPARTMENTS = Object.freeze(['OPD', 'IPD', 'ICU', 'Pharmacy', 'Administration', 'Front Office']);
const ADMINISTRATION_DEPARTMENT = 'Administration';
const BLOOD_GROUPS = Object.freeze(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const GENDERS = Object.freeze(['Male', 'Female']);

const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 5,
    MAX_LIMIT: 100,
});

const SEARCH_RESULT_LIMIT = 50;
const BCRYPT_ROUNDS = 12;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_COOKIE_NAME = 'refresh_token';

// fields that must never leave the server
const SENSITIVE_USER_FIELDS = '-passwordHash -refresh_token -verification_token -reset_token';

module.exports = {
    USER_STATUS,
    APPOINTMENT_STATUS,
    MEDICAL_RECORD_STATUS,
    DEPARTMENTS,
    ADMINISTRATION_DEPARTMENT,
    BLOOD_GROUPS,
    GENDERS,
    PAGINATION,
    SEARCH_RESULT_LIMIT,
    BCRYPT_ROUNDS,
    ONE_DAY_MS,
    REFRESH_COOKIE_NAME,
    SENSITIVE_USER_FIELDS,
};
