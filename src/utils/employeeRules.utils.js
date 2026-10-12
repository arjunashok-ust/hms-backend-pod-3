const { ROLES, MEDICAL_ROLES } = require('../constants/roles.constants');
const { VALIDATION_MESSAGES: V } = require('../constants/messages.constants');

const hasValue = (value) => value !== undefined && value !== null && value !== '';

// Role dependent rules shared by employee sign up (zod superRefine) and profile update (service).
// Returns a list of { path, message }, empty when the data is valid for the role.
const employeeRoleIssues = (role, data) => {
    const issues = [];
    const isDoctor = role === ROLES.DOCTOR;
    const slots = data.availabilitySlots;

    if (isDoctor) {
        if (!hasValue(data.consultationFee)) {
            issues.push({ path: ['consultationFee'], message: V.CONSULTATION_FEE_REQUIRED });
        } else if (Number.isNaN(Number(data.consultationFee)) || Number(data.consultationFee) < 0) {
            issues.push({ path: ['consultationFee'], message: V.CONSULTATION_FEE_NUMERIC });
        }
        if (!Array.isArray(slots) || slots.length === 0) {
            issues.push({ path: ['availabilitySlots'], message: V.AVAILABILITY_SLOTS_REQUIRED });
        }
        if (!hasValue(data.specialization)) {
            issues.push({ path: ['specialization'], message: V.SPECIALIZATION_REQUIRED });
        }
    } else {
        if (hasValue(data.consultationFee)) {
            issues.push({ path: ['consultationFee'], message: V.CONSULTATION_FEE_DOCTOR_ONLY });
        }
        if (Array.isArray(slots) ? slots.length > 0 : hasValue(slots)) {
            issues.push({ path: ['availabilitySlots'], message: V.AVAILABILITY_SLOTS_DOCTOR_ONLY });
        }
    }

    if (MEDICAL_ROLES.includes(role) && !hasValue(data.medicalRegistrationNo)) {
        issues.push({ path: ['medicalRegistrationNo'], message: V.MED_REG_NO_REQUIRED });
    }

    return issues;
};

module.exports = { employeeRoleIssues };
