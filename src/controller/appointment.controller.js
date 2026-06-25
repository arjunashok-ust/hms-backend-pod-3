const Appointment = require('../models/appointment.model');
const Employee = require('../models/employee.model');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');

const ERR = require('../utils/errors.utils');
const asyncHandler = require('../utils/asyncHandler.utils');

const createAppointment = asyncHandler(async (req, res) => {
    const {
        patientId,
        doctorEmployeeId,
        date,
        status,
        timeSlot,
        createdByEmployeeId
    } = req.body;

    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const patient = await Patient.findOne({ uhid: patientId });

    if (!patient) {
        throw ERR.patientNotFound();
    }

    const doctor = await User.findOne({ employeeId: doctorEmployeeId, role: 'Doctor', status: 'Active' });

    if (!doctor) {
        throw ERR.doctorNotFound();
    }

    const creator = await User.findOne({ $or: [{ employeeId: createdByEmployeeId }, { patientId: createdByEmployeeId }] });

    if (!creator) {
        throw ERR.employeeNotFound();
    }

    const existingAppointment = await Appointment.findOne({
        doctorEmployeeId,
        date: formattedDate,
        timeSlot,
        status: { $ne: 'Cancelled' }
    });

    if (existingAppointment) {
        throw ERR.existingSlot()
    }


    const existingPatientAppointment = await Appointment.findOne({
        patientId: patientId,
        date: formattedDate,
        timeSlot: timeSlot,
        status: { $ne: 'Cancelled' }
    })

    if (existingPatientAppointment) {
        throw ERR.existingPatientAppointment();
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
});

const getAllAppointments = asyncHandler(async (req, res) => {
    const selectedText = req.query.selectedText?.trim();
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (selectedText) {
        filter.$text = { $search: selectedText };
    }

    const appointments = await Appointment.find(filter).skip(skip).limit(limit);

    const total = await Appointment.countDocuments(filter);

    return res.status(200).json({
        data: appointments,
        total: total,
        page: page,
        totalPages: Math.ceil(total / limit),
    });
});

const getDoctors = asyncHandler(async (req, res) => {
    const doctorUser = await User.find({ role: 'Doctor', status: 'Active', isDeleted: false });

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
});

const getAppointmentUiData = asyncHandler(async (req, res) => {
    const [appointmentCount, bookedCount, cancelledCount, completedCount] =
        await Promise.all([
            Appointment.countDocuments({ isDeleted: false }),
            Appointment.countDocuments({ status: 'Booked', isDeleted: false }),
            Appointment.countDocuments({ status: 'Cancelled', isDeleted: false }),
            Appointment.countDocuments({ status: 'Completed', isDeleted: false }),
        ]);


    return res.status(200).json({
        appointmentCount,
        bookedCount,
        cancelledCount,
        completedCount,
    })
});

const deleteAppointment = asyncHandler(async (req, res) => {
    const appointmentId = req.query.appointmentId;
    const deletedBy = req.query.deletedBy;

    const deleted = await Appointment.findOneAndUpdate({ appointmentId: appointmentId }, {
        isDeleted: true,
        deletedBy,
        deletedAt: Date.now()
    });

    if (!deleted) {
        throw ERR.appointmentNotFound();
    }

    return res.status(200).json({ message: 'Appointment Deleted Sucessfully' });
});

const getAppointmentsByPatientId = asyncHandler(async (req, res) => {
    const patientId = req.query.patientId;

    const patient = await Patient.findOne({ uhid: patientId, isDeleted: false });

    if (!patient) {
        throw ERR.patientNotFound();
    }

    const appointments = await Appointment.find({ patientId: patientId, isDeleted: false });

    return res.status(200).json(appointments);
});

const getDoctorByEmployeeId = asyncHandler(async (req, res) => {
    const employeeId = req.query.employeeId;

    const doctor = await Employee.findOne({ employeeCode: employeeId, isDeleted: false });

    if (!doctor) {
        throw ERR.doctorNotFound();
    }

    return res.status(200).json(doctor);
});

const editAppointment = asyncHandler(async (req, res) => {
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
        status: { $ne: 'Cancelled' },
        isDeleted: false
    });

    if (existingAppointment) {
        throw ERR.existingSlot();
    }

    const appointment = await Appointment.findOneAndUpdate({ appointmentId }, {
        patientId,
        doctorEmployeeId,
        date,
        timeSlot,
        status,
        isDeleted: false
    }, {
        new: true,
        runValidators: true,
    });

    if (!appointment) {
        throw ERR.appointmentNotFound();
    }

    return res.status(200).json({ message: "Appointment updated successfully" });
});

const editAppointmentStatus = asyncHandler(async (req, res) => {
    const {
        appointmentId,
        status
    } = req.body;

    const appointment = await Appointment.findOneAndUpdate({ appointmentId, isDeleted: false }, {
        status,
    }, {
        new: true,
        runValidators: true,
    });

    if (!appointment) {
        throw ERR.appointmentNotFound();
    }

    return res.status(200).json({ message: "Appointment status updated successfully" });
});

const getAppointmentByDoctorIdOrPatientId = asyncHandler(async (req, res) => {
    const {
        doctorId,
        patientId,
        appointmentId,
    } = req.query;

    let filters = [{ status: 'Completed', isDeleted: false }];

    let conditions = [];

    if (patientId || doctorId) {
        if (doctorId) {
            conditions.push({ doctorId: { $regex: escapeRegex(doctorId) } });
        }

        if (patientId) {
            conditions.push({ patientId: { $regex: escapeRegex(patientId) } });
        }
    } else if (appointmentId) {
        conditions.push({ appointmentId: { $regex: escapeRegex(appointmentId) } });
    }

    if (conditions.length > 0) {
        filters.push({ $or: conditions });
    }

    const appointments = await Appointment.find({
        $and: filters,
    });

    return res.status(200).json(appointments);
});


const escapeRegex = (text) => text?.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)


module.exports = {
    createAppointment,
    getAllAppointments,
    getDoctors,
    getAppointmentUiData,
    deleteAppointment,
    getAppointmentsByPatientId,
    getDoctorByEmployeeId,
    editAppointment,
    editAppointmentStatus,
    getAppointmentByDoctorIdOrPatientId,
}

