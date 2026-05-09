const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const employeeSchema = new mongoose.Schema({
    employeeCode: { type: String, unique: true, },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    department: {
        type: String,
        enum: ["OPD", "IPD", "Lab", "Pharmacy", "Admin"],
        required: true
    },
    designation: { type: String, required: true },
    status: { type: Boolean, default: true },
    joiningDate: { type: Date, required: true },
    medicalRegistrationNo: { type: String, unique: true },
    specialization: { type: String },
    qualification: [{ type: String }],
    consultationFee: { type: Number, required: true },
    availabilitySlots: [
        {
            type: String,
            enum: [
                '00:00 - 01:00',
                '01:00 - 02:00',
                '02:00 - 03:00',
                '03:00 - 04:00',
                '04:00 - 05:00',
                '06:00 - 07:00',
                '07:00 - 08:00',
                '08:00 - 09:00',
                '09:00 - 10:00',
                '10:00 - 11:00',
                '11:00 - 12:00',
                '12:00 - 13:00',
                '13:00 - 14:00',
                '14:00 - 15:00',
                '15:00 - 16:00',
                '16:00 - 17:00',
                '17:00 - 18:00',
                '19:00 - 20:00',
                '20:00 - 21:00',
                '21:00 - 22:00',
                '22:00 - 23:00',
                '23:00 - 00:00'
            ]
        }
    ]
}, { timestamps: true });

employeeSchema.pre("save", async function () {
    if (this.isNew) {
        this.employeeCode = await generateId("employee", "EMP");
    }
});

module.exports = mongoose.model("Employees", employeeSchema);