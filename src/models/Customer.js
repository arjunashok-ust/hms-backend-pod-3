const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
    uhid: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    gender: {
        type: String,
        enum: [ "MALE", "FEMALE", "OTHER" ]
    },
    dob: {
        type: Date,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    emergencyContact: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: [ "ACTIVE", "INACTIVE" ],
        required: true
    }
});

customerSchema.pre('save', async function (next) {
    if(this.isNew) {
        try {
            const counter = await Counter.findOneAndUpdate(
                { name: "customer" },
                { $inc: { seq: 1}},
                { new: true, upsert: true }
            );
            this.uhid = `UHID-${String(counter.seq).padStart(6, '0')}`;
        } catch(err) {
            return next(err);
        }
    }
    next();
});

const customerModel = mongoose.model("Customer",customerSchema);