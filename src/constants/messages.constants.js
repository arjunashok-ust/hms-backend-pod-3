// Single source of truth for every user facing message.
// ERROR_MESSAGES are consumed through utils/errors.utils.js (ERR), the rest by the zod schemas / services.

const ERROR_MESSAGES = Object.freeze({
    EMAIL_EXISTS: 'Email is already registered.',
    PHONE_EXISTS: 'Phone number is already registered',
    UNIQUE_MED_REG_NO: 'Medical registration no should be unique',
    MEDICAL_RECORD_EXISTS: 'Medical record already exists',
    NODE_EXISTS: 'Node already exists',
    DUPLICATE_ENTRY: 'A record with the same value already exists',

    USER_NOT_FOUND: 'User not found',
    EMPLOYEE_NOT_FOUND: 'Employee not found',
    NO_USERS_FOUND: 'No users found',
    PATIENT_NOT_FOUND: 'Patient not found',
    DOCTOR_NOT_FOUND: 'Doctor not found',
    ROLE_NOT_FOUND: 'Role not found',
    APPOINTMENT_NOT_FOUND: 'Appointment not found',
    MEDICAL_RECORD_NOT_FOUND: 'Medical Record not found',
    TOKEN_NOT_FOUND: 'Token not found',
    NODE_NOT_FOUND: 'Node not found',

    EXISTING_PATIENT_APPOINTMENT: 'Patient have another appointment booked for this slot',
    EXISTING_SLOT: 'Time slot already booked',

    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_INVALID_OR_EXPIRED: 'Invalid or expired token',
    AUTH_REQUIRED: 'Authentication required',

    EMAIL_NOT_VERIFIED: 'Email not verified',
    ACCOUNT_NOT_ACTIVATED: 'Account not activated',
    VERIFICATION_TOKEN_INVALID: 'Verification token in invalid',

    ALREADY_ACTIVATED: 'Account is already activated',
    ALREADY_NOT_ACTIVATED: 'Account is already not active',

    MED_ROLE_REQUIRED: 'This role requires medical registration number',
    QUALIFICATION_REQUIRED: 'This role requires qualification',

    CLIENT_MOBILE_APP: 'Only patients are allowed to sign in using the mobile app',
    SET_PASSWORD: 'Set password is only allowed for first time users',

    UNKNOWN_ROLE: 'Unknown role',
    NODE_CREATE_FAILED: 'Error creating node',

    APPOINTMENT_PAST_TIME: 'You cant book appointment in the past',
    DOCTOR_NO_SLOT: 'No slots find for doctor',

    ACCESS_DENIED: 'You are not authorized to perform this action.',
    INTERNAL_SERVER_ERROR: 'Internal server error',
});

const SUCCESS_MESSAGES = Object.freeze({
    ACCOUNT_CREATED: 'Account created successfully.',
    LOGIN: 'Login successful',
    PASSWORD_SET: 'Password is set',
    EMAIL_VERIFIED: 'Email verified successfully',
    RESET_LINK_SENT: 'Reset link is sent to mail',
    PASSWORD_RESET: 'Password reset successful.',
    LOGOUT: 'User logged out successfully',

    PATIENT_DELETED: 'Patient deleted successfully',
    PATIENT_PROFILE_UPDATED: 'Patient profile updated successfully.',

    ACCOUNT_DELETED: 'Account deleted successfully',
    ACCOUNT_ACTIVATED: 'Account activated successfully',
    ACCOUNT_REJECTED: 'Account rejected successfully',
    PROFILE_UPDATED: 'Profile updated successfully!',

    APPOINTMENT_CREATED: 'Appointment created successfully',
    APPOINTMENT_UPDATED: 'Appointment updated successfully',
    APPOINTMENT_STATUS_UPDATED: 'Appointment status updated successfully',
    APPOINTMENT_DELETED: 'Appointment deleted successfully',

    MEDICAL_RECORD_CREATED: 'Medical record created successfully.',
    MEDICAL_RECORD_UPDATED: 'Medical record updated successfully.',
    MEDICAL_RECORD_DELETED: 'Medical record deleted successfully',

    NODE_DELETED: 'Node deleted successfully',
});

const VALIDATION_MESSAGES = Object.freeze({
    // generic
    PAGE_INVALID: 'Page must be a positive integer',
    LIMIT_INVALID: 'Limit must be between 1 and 100',
    SEARCH_TEXT_REQUIRED: 'Search text is required',
    DATE_INVALID: 'Invalid date format',

    // identity / credentials
    NAME_REQUIRED: 'Name is required.',
    NAME_INVALID: 'Name must contain only letters and spaces',
    EMAIL_REQUIRED: 'Email is required.',
    EMAIL_INVALID: 'Invalid email format',
    PASSWORD_REQUIRED: 'Password is required.',
    PASSWORD_MIN_LENGTH: 'Password must contain atleast 8 characters.',
    PASSWORD_UPPERCASE: 'Password must contain a uppercase character',
    PASSWORD_DIGIT: 'Password must contain a digit',
    ROLE_REQUIRED: 'Role is required.',
    ROLE_INVALID: 'Invalid role.',
    ROLE_NAME_REQUIRED: 'Role name is required!',
    PERMISSION_INVALID: 'Invalid permission format',
    VERIFICATION_TOKEN_REQUIRED: 'Verification Token Is Required',
    RESET_TOKEN_REQUIRED: 'Reset token is required',

    // employee
    DEPARTMENT_REQUIRED: 'Department is required.',
    DEPARTMENT_INVALID: 'Invalid department.',
    DESIGNATION_REQUIRED: 'Designation is required',
    JOINING_DATE_REQUIRED: 'Joining date is required.',
    EMPLOYEE_ID_REQUIRED: 'Employee Id is Required',
    CONSULTATION_FEE_REQUIRED: 'Consultation fee is required for doctors.',
    CONSULTATION_FEE_NUMERIC: 'Consultation fee must be numeric.',
    CONSULTATION_FEE_DOCTOR_ONLY: 'Consultation fee is only for doctors',
    AVAILABILITY_SLOTS_REQUIRED: 'Availability slots are required for doctors.',
    AVAILABILITY_SLOTS_DOCTOR_ONLY: 'Availability slots are only for doctors.',
    MED_REG_NO_REQUIRED: 'Medical registration no is required for this role',
    SPECIALIZATION_REQUIRED: 'Specialization is required for this role',

    // patient
    PATIENT_ID_REQUIRED: 'Patient Id is Required',
    GENDER_REQUIRED: 'Gender is required',
    GENDER_INVALID: 'Invalid gender',
    PHONE_REQUIRED: 'Phone Number Invalid',
    DOB_REQUIRED: 'DOB is required',
    ADDRESS_REQUIRED: 'Address is required',
    BLOOD_GROUP_REQUIRED: 'Blood group is required',
    BLOOD_GROUP_INVALID: 'Invalid blood group',
    DOCTOR_ID_REQUIRED: 'Doctor Id is Required',

    // appointment
    APPOINTMENT_ID_REQUIRED: 'Appointment Id is Required',
    APPOINTMENT_DATE_REQUIRED: 'Date is Required',
    TIME_SLOT_REQUIRED: 'Time Slot is Required',
    STATUS_REQUIRED: 'Status is required',
    STATUS_INVALID: 'Invalid status',

    // medical record
    MEDICAL_RECORD_ID_REQUIRED: 'Medical Record Id is required.',
    COMPLAINT_REQUIRED: 'complaint is required',
    SYMPTOMS_REQUIRED: 'symptoms are required',
    DIAGNOSIS_REQUIRED: 'diagnosis is required',
    DOCTOR_ID_FIELD_REQUIRED: 'doctorId is required',
    PATIENT_ID_FIELD_REQUIRED: 'patientId is required',
    APPOINTMENT_ID_FIELD_REQUIRED: 'appointmentId is required',

    // node
    NODE_NAME_REQUIRED: 'Node name is required',
    NODE_PATH_REQUIRED: 'Node path is required',
    NODE_ICON_REQUIRED: 'Node icon is required',
    NODE_ORDER_INVALID: 'Node order must be a number',
    NODE_ROLE_REQUIRED: 'At least one role is required',
});

const EMAIL_SUBJECTS = Object.freeze({
    EMPLOYEE_CREDENTIALS: 'HMS System | Employee Credentials',
    ADMIN_APPROVAL: 'HMS Notification | User Approval',
    EMPLOYEE_VERIFICATION: 'HMS System | User Email Verification',
    PATIENT_CREDENTIALS: 'HMS App | Patient Credentials',
    PATIENT_VERIFICATION: 'HMS System | Patient Email Verification',
    PASSWORD_RESET: 'HMS System | Password Reset',
});

module.exports = { ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES, EMAIL_SUBJECTS };
