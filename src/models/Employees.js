/**
 * @file Employees.js
 * @description
 * This file defines the Mongoose schema and model for employees.
 * It includes sub-schemas for weekly schedules and individual time slots.
 *
 * @overview
 * This schema represents an employee within the Hospital Management System.
 * It stores personal contact information, employment details like department and designation, and account status.
 * For medical staff (like doctors), it supports a detailed weekly schedule and professional qualifications.
 * A pre-save hook automatically generates a unique `employeeCode` for each new employee using a utility.
 * It also validates that the assigned department exists by checking against the `Departments` model.
 *
 * Connections:
 *   [authController, employeeController, etc.] -> EMPLOYEES.JS
 *   EMPLOYEES.JS -> generateID.js (utility)
 *   EMPLOYEES.JS -> Departments.js (for validation)
 */
const mongoose = require("mongoose");
const generateId = require("../utils/generateID");
const Departments = require("./Departments");

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [
        /^([01]\d|2[0-3]):(00|30)$/,
        "Start time must be on the hour or half-hour (e.g., 10:00, 10:30)",
      ],
    },
    endTime: {
      type: String,
      required: true,
      match: [
        /^([01]\d|2[0-3]):(00|30)$/,
        "End time must be on the hour or half-hour (e.g., 10:00, 10:30)",
      ],
    },
  },
  { _id: false },
);

const dailyScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
    },
    slots: [timeSlotSchema],
  },
  { _id: false },
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "PASSWORD_CHANGE_PENDING",
        "ADMIN_APPROVAL_PENDING",
        "DELETED",
      ],
    },
    department: {
      type: String,
      required: true,
      validate: {
        validator: async function (value) {
          const department = await Departments.findOne({
            departmentName: value,
          });
          return !!department;
        },
        message: (props) => `${props.value} is not a valid department.`,
      },
    },

    designation: { type: String, required: true },

    joiningDate: { type: Date, required: true },

    medicalRegistrationNo: {
      type: String,
      sparse: true,
      default: undefined,
    },

    specialization: { type: String },
    qualification: [{ type: String }],
    consultationFee: { type: Number },
    weeklySchedule: [dailyScheduleSchema],
  },
  { timestamps: true },
);

employeeSchema.pre("save", async function () {
  if (this.isNew) {
    this.employeeCode = await generateId("employee", "EMP");
  }
});

module.exports = mongoose.model("Employees", employeeSchema);
