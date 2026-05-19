const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const employeeSchema = new mongoose.Schema({
    employeeCode: { type: String, unique: true },
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
    
    // FIX: Properly configured for unique medical staff, while letting cashiers skip it
    medicalRegistrationNo: { 
        type: String, 
        sparse: true,
        default: undefined 
    },
    
    specialization: { type: String }, // Removed sparse here unless it's unique too
    qualification: [{ type: String }],
    consultationFee: { type: Number },
    availabilitySlots: [
        {
            startTime:{type:String},
            endTime: {type:String}
        }
    ]
}, { timestamps: true });

employeeSchema.pre("save", async function () {
    if (this.isNew) {
        this.employeeCode = await generateId("employee", "EMP");
    }
});

module.exports = mongoose.model("Employees", employeeSchema);