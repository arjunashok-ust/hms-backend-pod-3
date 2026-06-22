const mongoose = require("mongoose");
const Role = require("../models/Role");
const PERMISSIONS = require("../constants/permissions");

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const ROLE_SEED_DATA = [
  {
    role_id: 1,
    role_name: "super_admin",
    role_permissions: Object.values(PERMISSIONS),
  },
  {
    role_id: 2,
    role_name: "admin",
    role_permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_EMPLOYEE,
      PERMISSIONS.VIEW_PROFILE,
      PERMISSIONS.VIEW_APPOINTMENT,
      PERMISSIONS.VIEW_PATIENT,
      PERMISSIONS.VIEW_APPROVAL,
      PERMISSIONS.VIEW_MEDICAL_RECORD,
      PERMISSIONS.VIEW_APPOINTMENT_STAT,
      PERMISSIONS.VIEW_PATIENT_STAT,

      PERMISSIONS.CREATE_PATIENT,
      PERMISSIONS.CREATE_EMPLOYEE,
      PERMISSIONS.CREATE_APPOINTMENT,
      PERMISSIONS.CREATE_MEDICAL_RECORD,

      PERMISSIONS.DELETE_EMPLOYEE,
      PERMISSIONS.DELETE_APPOINTMENT,
      PERMISSIONS.DELETE_PATIENT,
      PERMISSIONS.DELETE_MEDICAL_RECORD,

      PERMISSIONS.APPROVE_APPOINTMENT,
      PERMISSIONS.REJECT_APPOINTMENT,
      PERMISSIONS.COMPLETE_APPOINTMENT,
      PERMISSIONS.APPROVE_EMPLOYEE,

      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.EDIT_EMPLOYEE,
      PERMISSIONS.EDIT_PATIENT,
      PERMISSIONS.EDIT_APPOINTMENT,
      PERMISSIONS.UPDATE_FINALIZED_MEDICAL_RECORD,

      PERMISSIONS.ROLE_MANAGE,
      PERMISSIONS.NODE_MANAGE,
    ],
  },
  {
    role_id: 3,
    role_name: "receptionist",
    role_permissions: [
      PERMISSIONS.VIEW_APPOINTMENT,
      PERMISSIONS.VIEW_PATIENT,
      PERMISSIONS.VIEW_EMPLOYEE,
      PERMISSIONS.VIEW_PROFILE,
      PERMISSIONS.VIEW_APPOINTMENT_STAT,
      PERMISSIONS.VIEW_APPROVAL,
      PERMISSIONS.VIEW_MEDICAL_RECORD,

      PERMISSIONS.CREATE_PATIENT,
      PERMISSIONS.CREATE_APPOINTMENT,
      PERMISSIONS.CREATE_MEDICAL_RECORD,

      PERMISSIONS.APPROVE_APPOINTMENT,
      PERMISSIONS.REJECT_APPOINTMENT,

      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.EDIT_PATIENT,
      PERMISSIONS.EDIT_APPOINTMENT,
      PERMISSIONS.EDIT_MEDICAL_RECORD,
    ],
  },
  {
    role_id: 4,
    role_name: "doctor",
    role_permissions: [
      PERMISSIONS.VIEW_APPOINTMENT,
      PERMISSIONS.VIEW_PATIENT,
      PERMISSIONS.VIEW_PROFILE,
      PERMISSIONS.VIEW_MEDICAL_RECORD,
      PERMISSIONS.VIEW_APPOINTMENT_STAT,

      PERMISSIONS.CREATE_MEDICAL_RECORD,
      PERMISSIONS.COMPLETE_APPOINTMENT,

      PERMISSIONS.EDIT_PROFILE,
      PERMISSIONS.EDIT_MEDICAL_RECORD,
    ],
  },
  {
    role_id: 5,
    role_name: "patient",
    role_permissions: [
      PERMISSIONS.VIEW_APPOINTMENT,
      PERMISSIONS.VIEW_PROFILE,
      PERMISSIONS.VIEW_MEDICAL_RECORD,

      PERMISSIONS.CREATE_APPOINTMENT,

      PERMISSIONS.DELETE_APPOINTMENT, // self-cancel; controller must enforce ownership

      PERMISSIONS.EDIT_PROFILE,
    ],
  },
];

const seedRoles = async () => {
  for (const roleData of ROLE_SEED_DATA) {
    await Role.findOneAndUpdate(
      { role_name: roleData.role_name },
      roleData,
      { upsert: true, new: true }
    );
  }
  console.log("Roles seeded successfully");
};

if (require.main === module) {
  require("dotenv").config();
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      await seedRoles();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedRoles;