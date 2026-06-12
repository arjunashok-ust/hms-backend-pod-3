const Appointment = require('../models/appointment.model');
const Employee = require('../models/employee.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');

const createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            doctorEmployeeId,
            date,
            status,
            timeSlot,
            createdByEmployeeId
        } = req.body;

        const formattedDate = new Date(date);
        formattedDate.setHours(0,0,0,0);

        const patient = await Patient.findOne({ uhid: patientId });

        if (!patient) {
            return res.status(404).json({ message: "Patient Not Found!" });
        }

        const doctor = await User.findOne({ employeeId: doctorEmployeeId, role: 'Doctor', status: 'Active' });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor Not Found" });
        }

        const creator = await User.findOne({ $or: [{ employeeId: createdByEmployeeId }, { patientId: createdByEmployeeId }] });

        if (!creator) {
            return res.status(404).json({ message: "Creator Employee Not Found!" });
        }

        const existingAppointment = await Appointment.findOne({
            doctorEmployeeId,
            date: formattedDate,
            timeSlot,
            status: { $ne: 'Cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({
                message: "Time slot already booked"
            });
        }


        const existingPatientAppointment = await Appointment.findOne({
            patientId: patientId,
            date: formattedDate,
            timeSlot: timeSlot,
            status: { $ne: 'Cancelled' }
        })

        if (existingPatientAppointment) {
            return res.status(400).json({
                message: "Patient have another appointment booked for this slot",
            });
        }

        const appointment = await Appointment.create({
            patientId: patientId,
            doctorEmployeeId: doctorEmployeeId,
            date: formattedDate,
            timeSlot: timeSlot,
            status: status,
            createdByEmployeeId: createdByEmployeeId,
        });

        return res.status(200).json({
            message: "Appointment Created Sucessfully",
            date: appointment.date,
            status: appointment.status,
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
}

const getAllAppointments = async (req, res) => {
    try {
        const appointment = await Appointment.find();
        if (appointment.length === 0) {
            return res.status(404).json({ message: "No appointments found" });
        }
        return res.status(200).json(appointment);
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get All Appointments" });
    }
}

const getDoctors = async (req, res) => {
    try {
        const doctorUser = await User.find({ role: 'Doctor', status: 'Active' });

        if (!doctorUser.length) {
            return res.status(200).json([]);
        }

        const employeeIds = doctorUser.map((user => user.employeeId));

        const doctors = await Employee.find({
            employeeCode: {
                $in: employeeIds
            }
        }).sort({ name: 1 });

        return res.status(200).json(doctors);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get All Doctors" });
    }
}

const getAppointmentUiData = async (req, res) => {
    try {

        const [appointmentCount, bookedCount, cancelledCount, completedCount] =
            await Promise.all([
                Appointment.countDocuments(),
                Appointment.countDocuments({ status: 'Booked' }),
                Appointment.countDocuments({ status: 'Cancelled' }),
                Appointment.countDocuments({ status: 'Completed' }),
            ]);


        return res.status(200).json({
            appointmentCount,
            bookedCount,
            cancelledCount,
            completedCount,
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get All Doctors" });
    }
}

const deleteAppointment = async (req, res) => {
    try {
        const appointmentId = req.query.appointmentId;
        const deleted = await Appointment.findOneAndDelete({ appointmentId: appointmentId });

        if (!deleted) {
            return res.status(404).json({ message: "Appointment Not Found" });
        }

        return res.status(200).json({ message: 'Appointment Deleted Sucessfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Delete Appointment" });
    }
}

const getAppointmentsByPatientId = async (req, res) => {
    try {
        const patientId = req.query.patientId;

        const patient = await Patient.findOne({ uhid: patientId });

        if (!patient) {
            return res.status(404).json({ message: "Patient Not Found" });
        }

        const appointments = await Appointment.find({ patientId: patientId });

        return res.status(200).json(appointments);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get Appointment By Patient Id" });
    }
}

const getDoctorByEmployeeId = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;

        const doctor = await Employee.findOne({ employeeCode: employeeId });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor Not Found" });
        }

        return res.status(200).json(doctor);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Get Doctor By Employee Id" });
    }
}

const editAppointment = async (req, res) => {
    try {
        const {
            appointmentId,
            patientId,
            doctorEmployeeId,
            date,
            timeSlot,
            status,
        } = req.body;

        const existingAppointment = await Appointment.findOne({
            doctorEmployeeId,
            date,
            timeSlot,
            status: { $ne: 'Cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({
                message: "Time slot already booked"
            });
        }

        const appointment = await Appointment.findOneAndUpdate({ appointmentId }, {
            patientId,
            doctorEmployeeId,
            date,
            timeSlot,
            status,
        }, {
            new: true,
            runValidators: true,
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        return res.status(200).json({ message: "Appointment updated successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Edit Appointment" });
    }
}

const editAppointmentStatus = async (req, res) => {
    try {
        const {
            appointmentId,
            status
        } = req.body;

        const appointment = await Appointment.findOneAndUpdate({ appointmentId }, {
            status,
        }, {
            new: true,
            runValidators: true,
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        return res.status(200).json({ message: "Appointment status updated successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error During Edit Apponintment Status" });
    }
}

module.exports = { 
    createAppointment, 
    getAllAppointments, 
    getDoctors, 
    getAppointmentUiData, 
    deleteAppointment, 
    getAppointmentsByPatientId, 
    getDoctorByEmployeeId, 
    editAppointment, 
    editAppointmentStatus 
}

