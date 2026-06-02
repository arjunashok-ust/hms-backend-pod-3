const Appointment = require('../models/appointmnt');
const Employee    = require('../models/employee');
const Patient     = require('../models/patient');

// ─────────────────────────────────────────────
//  POST /api/appointments/create
//  Access : ADMIN | RECEPTIONIST only
// ─────────────────────────────────────────────
const createAppointment = async (req, res) => {
    try {

        // ── 1. ROLE GUARD ───────────────────────────────────────────────────
        const allowedRoles = ['Admin', 'Receptionist'];

        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only Admin or Receptionist can create appointments.',
            });
        }

        // ── 2. EXTRACT BODY FIELDS ──────────────────────────────────────────
        const { patientId, doctorEmployeeId, date, timeSlot, status } = req.body;

        // ── 3. REQUIRED FIELD VALIDATION ────────────────────────────────────
        if (!patientId || !doctorEmployeeId || !date || !timeSlot) {
            return res.status(400).json({
                success: false,
                message: 'patientId, doctorEmployeeId, date, and timeSlot are required.',
            });
        }

        // ── 4. VALIDATE STATUS (if provided) ────────────────────────────────
        const allowedStatuses = ['BOOKED', 'CANCELLED', 'COMPLETED'];
        const appointmentStatus = status ? status : 'BOOKED'; // default → BOOKED

        if (!allowedStatuses.includes(appointmentStatus)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`,
            });
        }

        // ── 5. VALIDATE DATE (must not be in the past) ──────────────────────
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format.',
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // compare dates only, ignore time
        if (appointmentDate < today) {
            return res.status(400).json({
                success: false,
                message: 'Appointment date cannot be in the past.',
            });
        }

        // ── 6. VALIDATE PATIENT EXISTS ──────────────────────────────────────
        const patientExists = await Patient.findById(patientId);
        if (!patientExists) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found.',
            });
        }

        // ── 7. VALIDATE DOCTOR EXISTS & HAS DOCTOR DESIGNATION ──────────────
        const doctor = await Employee.findById(doctorEmployeeId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor (Employee) not found.',
            });
        }

        if (doctor.designation!== 'Doctor') {
            return res.status(400).json({
                success: false,
                message: 'The selected employee is not designated as a Doctor.',
            });
        }

        // ── 8. PREVENT DUPLICATE SLOT BOOKING ──────────────────────────────
        const slotTaken = await Appointment.findOne({
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            status: 'BOOKED',
        });

        if (slotTaken) {
            return res.status(409).json({
                success: false,
                message: `Time slot "${timeSlot}" is already booked for this doctor on the selected date.`,
            });
        }

        // ── 9. CREATE APPOINTMENT ───────────────────────────────────────────
        const newAppointment = new Appointment({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            status: appointmentStatus,
            createdByEmployeeId: req.user._id, // logged-in Admin / Receptionist
        });

        const savedAppointment = await newAppointment.save(); // ✅ Fixed

        // ── 10. POPULATE & RESPOND ──────────────────────────────────────────
        const populatedAppointment = await savedAppointment.populate([
            { path: 'patientId',           select: 'name email phone' },
            { path: 'doctorEmployeeId',    select: 'name designation department' },
            { path: 'createdByEmployeeId', select: 'name role' },
        ]);

        return res.status(201).json({
            success: true,
            message: 'Appointment created successfully.',
            data: populatedAppointment,
        });

    } catch (error) {
        console.error('createAppointment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error: error.message,
        });
    }
};
// GET ALL APPOINTMENTS
const getAllAppointments = async (req, res) => {
  try {

    const appointments = await Appointment.find()
      .populate({
        path: 'patientId',
        select: 'name email'
      })
      .populate({
        path: 'doctorEmployeeId',
        select: 'name designation department'
      })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// DELETE APPOINTMENT
const deleteAppointment = async (req, res) => {
  try {

    const allowedRoles = ['Admin', 'Receptionist'];

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    await Appointment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Appointment deleted successfully"
    });

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { createAppointment , deleteAppointment, getAllAppointments};
