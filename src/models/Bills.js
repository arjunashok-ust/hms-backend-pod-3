const mongoose = require("mongoose");
const generateId = require("../utils/generateID");

const billSchema = new mongoose.Schema({
    billCode: { type: String, unique: true },
    patientID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patients",
        required: true
    },
    appointmentID: { type: mongoose.Schema.Types.ObjectId, ref: "Appointments", },
    items: [
        {
            serviceName: String,
            amount: Number
        }
    ],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ["PENDING", "PAID", "PARTIAL"],
        default: "Pending"
    },

    createdByEmployeeID: { type: mongoose.Schema.Types.ObjectId, ref: "Employees" }
}, {
    timestamps:
        { createdAt: "createdAt" }
});


billSchema.pre("save", async function () {
    if (this.isNew) {
        this.billCode = await generateId("bill", "BILL");
    }
});
module.exports = mongoose.model("Bills", billSchema);