const Appointment = require("../models/Appointment")
const Employee = require('../models/Employee');
const Patient = require("../models/Patient");
const User = require('../models/User');
const {generateSlots} = require('../utils/slotGenerator');

  // add 
  exports.addAppointment = async (req, res) => {

    try {

      const {
        patientId,
        doctorEmployeeId,
        timeSlot,
        date,
      } = req.body;

      const patient = await Patient.findOne({UHID: patientId});

      if (!patient) {
         return res.status(404).json({
            message: "Patient not found"
         });
      }

      const doctor = await Employee.findOne({ employeeCode : doctorEmployeeId })
      if (!doctor) {
        return res.status(404).json({ error: "doctor not found " })
      }

      const existingAppointment = await Appointment.findOne({
        doctorEmployeeId,
        date,
        timeSlot,
        status: "BOOKED"
      });
      if (existingAppointment) {
        return res.status(400).json({ error: "Time slot already booked. " })
      }
      const appointment = await Appointment.create(
        {
          patientId,
          doctorEmployeeId,
          date,
          timeSlot,
          createdByEmployeeId:req.user.id
          
        }
      );

      return res.status(201).json({ message: "Appointment booked",appointment })
    } catch (error) {
      console.error(error);
      return res.json({ error: "Error during booking appointment " });

    }
  };

exports.getAllDoctors = async (req, res) => {

  try {

    const doctorUsers =
      await User.find({
        role: 'DOCTOR'
      });

    const employeeIds =
      doctorUsers.map(
        user => user.employeeId
      );

    const doctors =
      await Employee.find({

        employeeCode: {
          $in: employeeIds
        }

      })
      .sort({
        name: 1
      });

    return res.status(200)
      .json(doctors);

  } catch (err) {

    console.error(err);

    return res.status(500).json({

      message:
        'Server Error During Get All Doctors'

    });

  }

};
// delete
exports.delAppointment = async (req, res) => {
  try {
    const appointmentId = req.query.appointmentId;
    const existingAppointment = await Appointment.findOne({ appointmentId })
    if (!existingAppointment) {
      return res.status(400).json({ error: "invalid appointment" })
    }
    await existingAppointment.deleteOne();
    return res.status(200).json({ message: "Appointment successfully deleted" })

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "error during delete " });

  }
}

//ui
exports.getAppointmentUI = async(req,res) => {
    try{
        const appointmentLength = await Appointment.find().countDocuments();
        if(!appointmentLength){
            return res.status(404).json({ message: "No Appointment Found!" });
        }

        const bookedCount = await Appointment.find({status: 'BOOKED'}).countDocuments();
        const cancelledCount = await Appointment.find({status: 'CANCELLED'}).countDocuments();
        const completedCount = await Appointment.find({status: 'COMPLETED'}).countDocuments();

        return res.status(200).json({
            appointmentLength,
            bookedCount,
            cancelledCount,
            completedCount,
        })
    } catch(error){
        console.error(error);
        return res.status(500).json({ message: "Server error during Get All Doctors" });
    }
}

//get all
exports.getAllAppointments = async (req, res) => {
  try {

    const getAll = await Appointment.find()
    if (getAll.length === 0) {
      return res.status(404).json({ message: "No Appointments Found" });
    }
    return res.status(200).json({
      success: true,
      message: "all records fetched succesfully",
      count: getAll.length,
      data: getAll
    })

  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: "Error during get all appointments" })

  }
}

//availability slots
exports.getAvailableSlots =
async (req, res) => {

  try {

    const {
      doctorEmployeeId,
      date
    } = req.query;

    const doctor =
      await Employee.findOne({
        employeeCode:
          doctorEmployeeId
      });

    if (!doctor) {

      return res.status(404)
        .json({
          message:
            'Doctor not found'
        });

    }

    const allSlots =
      generateSlots(
        doctor.availabilitySlots
      );

   const startDate = new Date(date);

startDate.setHours(
  0,
  0,
  0,
  0
);

const endDate = new Date(date);

endDate.setHours(
  23,
  59,
  59,
  999
);

const appointments =
  await Appointment.find({

    doctorEmployeeId,

    date: {
      $gte: startDate,
      $lte: endDate
    }

  });

    const bookedSlots = new Set(
      appointments.map(
        a => a.timeSlot
      )
    );

    const availableSlots =
      allSlots.filter(
        slot =>
          !bookedSlots.has(slot)
      );

    return res.status(200).json({

      doctor:
        doctor.name,

      availableSlots

    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({

      message:
        'Error fetching slots'

    });

  }

};