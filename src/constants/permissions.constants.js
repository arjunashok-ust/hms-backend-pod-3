// permission strings stored in the `roles` collection (role_permissions)
const PERMISSIONS = Object.freeze({
    VIEW_DASHBOARD: 'view:dashboard',
    VIEW_PROFILE: 'view:profile',
    EDIT_PROFILE: 'edit:profile',

    VIEW_EMPLOYEE: 'view:employee',
    EDIT_EMPLOYEE: 'edit:employee',
    APPROVE_USER: 'approve:user',
    REJECT_USER: 'reject:user',

    VIEW_PERMISSION: 'view:permission',
    EDIT_PERMISSION: 'edit:permission',

    VIEW_PATIENT: 'view:patient',

    CREATE_APPOINTMENT: 'create:appointment',
    VIEW_APPOINTMENT: 'view:appointment',
    EDIT_APPOINTMENT: 'edit:appointment',
    DELETE_APPOINTMENT: 'delete:appointment',
    APPROVE_APPOINTMENT: 'approve:appointment',

    CREATE_MEDICAL_RECORD: 'create:medical-record',
    VIEW_MEDICAL_RECORD: 'view:medical-record',
    EDIT_MEDICAL_RECORD: 'edit:medical-record',
    DELETE_MEDICAL_RECORD: 'delete:medical-record',

    CREATE_NODE: 'create:node',
    EDIT_NODE: 'edit:node',
    DELETE_NODE: 'delete:node',
});

module.exports = { PERMISSIONS };
