const User = require('../models/user.model');
const Employee = require('../models/employee.model');
const Patient = require('../models/patient.model');
const Appointment = require('../models/appointment.model');

// Get User
const getUserProfile = async (req, res) => {
    try {
        const email = req.query.email;

        const user = await User.findOne({ email });
        const employee = await Employee.findOne({ email });

        if (!user) return res.status(404).json({ message: 'user not found.' });

        return res.status(200).json({
            message: 'Sucessfully obtained user information',
            name: employee.name,
            email: user.email,
            status: user.status,
            role: user.role,
            employeeId: user.employeeId,
            isVerified: user.isVerified,
            firstLogin: user.firstLogin,
            department: employee.department,
            designation: employee.designation,
            joiningDate: employee.joiningDate,
            medicalRegistrationNo: employee.medicalRegistrationNo,
            specialization: employee.specialization,
            qualification: employee.qualification,
            consultationFee: employee.consultationFee,
            availabilitySlots: employee.availabilitySlots
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during getUserProfile' });
    }
}

const createPatient = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact,
            status,
        } = req.body;

        const existingPatient = await Patient.findOne({ email: email });

        if (existingPatient) {
            return res.status(401).json({ message: 'Email is already registered.' });
        }

        await Patient.create({
            name: name,
            phone: phone,
            email: email,
            gender: gender,
            dob: dob,
            address: address,
            emergencyContact: emergencyContact,
            status: status
        });

        return res.status(200).json({ message: "Patient created sucessfully." });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Create Patient' });
    }
}

const getPatients = async (req, res) => {
    try {
        const patients = await Patient.find();
        if (!patients) {
            return res.status(404).json({ message: 'No Patients Found.' });
        }
        return res.status(200).json(patients);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Get Patients' });
    }
}

const deletePatient = async (req, res) => {
    try {
        const patientId = req.body.patientId;

        const patient = await Patient.findOne({ uhid: patientId });
        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        await patient.deleteOne();

        return res.status(200).json({ message: 'Patient Deleted Sucessfully' });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server Error During Delete Patient' });
    }
}

const getPatientProfile = async (req, res) => {
    try {
        const email = req.query.email;
        const user = await User.findOne({ email });
        const patient = await Patient.findOne({ email });

        if (!user) return res.status(404).json({ message: 'user not found.' });

        return res.status(200).json({
            message: 'Sucessfully obtained user information',
            email: user.email,
            status: user.status,
            role: user.role,
            isVerified: user.isVerified,
            uhid: patient.uhid,
            name: patient.name,
            gender: patient.gender,
            dob: patient.dob,
            address: patient.address,
            phone: patient.phone,
            emergencyContact: patient.emergencyContact,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during getUserProfile' });
    }
}

const getPatientId = async (req, res) => {
    try {
        const email = req.query.email;
        const patient = await Patient.findOne({ email });
        if (!patient) return res.status(404).json({ message: 'patient not found.' });
        return res.status(200).json({
            message: "Patient id sent successfully",
            patientId: patient.uhid,
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during getPatientId' });
    }
}

const getAvailableTimeSlots = async (req, res) => {
    try {
        const employeeId = req.query.employeeId;
        const inputDate = new Date(req.query.date);
        const today = new Date();

        if (inputDate <= today) return res.status(400).json({ message: 'you cant book appointment in past' });

        const date = inputDate.toDateString();

        const doctor = await Employee.findOne({ employeeCode: employeeId });
        if (!doctor) return res.status(404).json({ message: 'doctor not found.' });
        const appointments = await Appointment.find();

        const allSlots = doctor.availabilitySlots;
        if (!allSlots) return res.status(404).json({ message: 'no slots found for doctor' });

        const bookedSlots = appointments.filter(
            (appointment) => {
                const apt_date = new Date(appointment.date).toDateString();
                return (appointment.doctorEmployeeId === doctor.employeeCode && date === apt_date && appointment.status != "Cancelled")
            }
        ).map((appointment) => appointment.timeSlot);

        const slots = allSlots.filter((slot) => !bookedSlots.includes(slot));
        if (!slots) return res.status(409).json({ message: 'no available slots found for doctor' });

        return res.status(200).json({
            message: "slots fetched sucessfully",
            slots,
        })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'internal server error during get available time slots' });
    }
}



module.exports = { getUserProfile, createPatient, getPatients, deletePatient, getPatientProfile, getPatientId, getAvailableTimeSlots }