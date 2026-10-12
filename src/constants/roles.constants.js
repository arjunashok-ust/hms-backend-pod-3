const ROLES = Object.freeze({
    OWNER: 'Owner',
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    DOCTOR: 'Doctor',
    RECEPTIONIST: 'Receptionist',
    CASHIER: 'Cashier',
    NURSE: 'Nurse',
    LAB_TECH: 'LabTech',
    PHARMACIST: 'Pharmacist',
    PATIENT: 'Patient',
});

// roles accepted by the employee sign up form
const SIGNUP_ROLES = Object.freeze([
    ROLES.ADMIN,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.CASHIER,
    ROLES.NURSE,
    ROLES.PHARMACIST,
    ROLES.LAB_TECH,
]);

// roles that must provide a medical registration number
const MEDICAL_ROLES = Object.freeze([
    ROLES.DOCTOR,
    ROLES.NURSE,
    ROLES.PHARMACIST,
    ROLES.LAB_TECH,
]);

// roles that must also provide a qualification when their profile is edited
const QUALIFICATION_REQUIRED_ROLES = Object.freeze([ROLES.DOCTOR, ROLES.NURSE]);

module.exports = { ROLES, SIGNUP_ROLES, MEDICAL_ROLES, QUALIFICATION_REQUIRED_ROLES };
