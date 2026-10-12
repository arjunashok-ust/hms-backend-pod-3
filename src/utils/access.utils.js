const ERR = require('./errors.utils');
const { ROLES } = require('../constants/roles.constants');

// `actor` is the decoded access token: { userId, email, role }
const isPatient = (actor) => actor?.role === ROLES.PATIENT;

const assertStaff = (actor) => {
    if (isPatient(actor)) throw ERR.accessDenied();
};

// patients may only touch their own data, staff are not restricted here (permissions handle them)
const assertPatientOwnsId = (actor, patientId) => {
    if (isPatient(actor) && actor.userId !== patientId) throw ERR.accessDenied();
};

const assertPatientOwnsEmail = (actor, email) => {
    if (isPatient(actor) && actor.email?.toLowerCase() !== email?.toLowerCase()) throw ERR.accessDenied();
};

module.exports = { isPatient, assertStaff, assertPatientOwnsId, assertPatientOwnsEmail };
