const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        billId: {
            type: String
        },

        amount: {
            type: Number,
            default: 0
        },

        method: {
            type: String,
            enum: ["CASH", "CARD", "UPI"],
        },

        paidAt: {
            type: Date,
            default: Date.now()
        },

        revceivedByEmplyeeId: {
            type: String
        }

    }
)

module.exports = mongoose.model("Payment", paymentSchema);