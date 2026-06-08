const mongoose=require('mongoose');

const patientSchema = mongoose.Schema({
  UHID: {
    type: String,
    unique: true,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    unique: true,
    trim: true,
  },

  gender: {
    type: String,
    required: true,
  },

  date_of_birth: {
    type: Date,
  },

  bloodGroup: {
    type: String,
  },

  allergies: [
    {
      type: String,
    },
  ],

  address: {
    line1: String,
    city: String,
    postcode: String,
  },

  emergencyContact: {
    type: String,
    unique: true,
    trim: true,
  },

  status: {
    type: Boolean,
    default: true,
  },
});
// Pre-save hook to generate sequential ID

patientSchema.pre('save', async function (next) {

    if (this.isNew) {

        try {

            const counter = await Counter.findOneAndUpdate(

                { name: 'patient' },

                { $inc: { seq: 1 } }, // Creates sequence

                { new: true, upsert: true } // upsert is update and insert

            );

            this.UHID = `UHID-${String(counter.seq).padStart(6, '0')}`; // create 6 digit sequence number

        } catch (err) {

            return next(err);

        }

    }

    next();

});
 
module.exports=mongoose.model("Patient",patientSchema);

