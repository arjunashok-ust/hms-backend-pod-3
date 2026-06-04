const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

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
      ],
    },
    department: {
      type: String,
      enum: ["OPD", "IPD", "LAB", "PHARMACY", "ADMIN"],
      required: true,
    },

    designation: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "INACTIVE",
        "PASSWORD_CHANGE_PENDING",
        "ADMIN_APPROVAL_PENDING",
      ],
    },

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
