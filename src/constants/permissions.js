/**
 * Canonical list of permission strings used across the app.
 * Always reference these constants in routes/seed data — never raw strings —
 * to avoid typos like the one flagged below.
 */
module.exports = {
  // View permissions
  VIEW_DASHBOARD: "view:dashboard",
  VIEW_EMPLOYEE: "view:employee",
  VIEW_PROFILE: "view:profile",
  VIEW_APPOINTMENT: "view:appointment",
  VIEW_PATIENT: "view:patient",
  VIEW_APPROVAL: "view:approval",
  VIEW_MEDICAL_RECORD: "view:medical-record",
  VIEW_APPOINTMENT_STAT: "view:appointment-stat",
  VIEW_PATIENT_STAT: "view:patient-stat",

  // Create permissions
  CREATE_PATIENT: "create:patient",
  CREATE_EMPLOYEE: "create:employee",
  CREATE_APPOINTMENT: "create:appointment",
  CREATE_MEDICAL_RECORD: "create:medical-record",
  
  // Delete permissions
  DELETE_EMPLOYEE: "delete:employee",
  DELETE_APPOINTMENT: "delete:appointment",
  DELETE_PATIENT: "delete:patient",
  DELETE_MEDICAL_RECORD: "delete:medical-record",

  // Appointment workflow
  APPROVE_APPOINTMENT: "approve:appointment",
  REJECT_APPOINTMENT: "reject:appointment",
  COMPLETE_APPOINTMENT: "complete:appointment",

  // Employee approval workflow (self-signup -> admin approval)
  APPROVE_EMPLOYEE: "approve:employee",

  // Edit permissions
  EDIT_APPOINTMENT: "edit:appointment",
  EDIT_PATIENT: "edit:patient",
  EDIT_MEDICAL_RECORD: "edit:medical-record",
  UPDATE_FINALIZED_MEDICAL_RECORD: "update-finalized:medical-record",
  EDIT_PROFILE: "edit:profile",
  EDIT_EMPLOYEE: "edit:employee", 


  ROLE_MANAGE: "role:manage",
  NODE_MANAGE: "node:manage",
};