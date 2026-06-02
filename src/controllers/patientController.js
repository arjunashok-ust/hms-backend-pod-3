const Patient = require("../models/Patient");

// CREATE PATIENT
exports.createPatient = async (req, res) => {

    try {
        const {
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact
        } = req.body;
        const existingPatient = await Patient.findOne({
            $or: [
                { email },
                { phone }
            ]
        });

        if (existingPatient) {
            return res.status(409).json({
                message: "Patient already exists"
            });
        }

        // CREATE PATIENT
        const patient = await Patient.create({
            name,
            phone,
            email,
            gender,
            dob,
            address,
            emergencyContact
        });

        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            patient
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Create Patient"
        });
    }
};

// GET ALL PATIENTS
exports.getAllPatients = async (req, res) => {

    try {
        const patients = await Patient.find()
            .sort({ createdAt: -1 });
        if (patients.length === 0) {
            return res.status(404).json({
                message: "No Patients Found"
            });
        }
        return res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Get All Patients"
        });
    }
};

// GET SINGLE PATIENT
exports.getSinglePatient = async (req, res) => {

    try {
        const patientId = req.params.patientId;
        const patient = await Patient.findOne({
            UHID: patientId
        });
        if (!patient) {
            return res.status(404).json({
                message: "Patient Not Found"
            });
        }
        return res.status(200).json({
            success: true,
            patient
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Get Single Patient"
        });
    }
};

// UPDATE PATIENT
exports.updatePatient = async (req, res) => {
    try {
        const patientId = req.params.patientId;

        const updatedPatient = await Patient.findOneAndUpdate(
            { UHID: patientId },
            req.body,
            { new: true }
        );
        if (!updatedPatient) {

            return res.status(404).json({
                message: "Patient Not Found"
            });
        }
        return res.status(200).json({
            success: true,
            message: "Patient Updated Successfully",
            updatedPatient
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Server Error During Update Patient"
        });
    }
};

// DELETE PATIENT
exports.deletePatient = async (req, res) => {

    try {
        const patientId = req.params.patientId;

        const patient = await Patient.findOne({
            UHID: patientId
        });
        if (!patient) {

            return res.status(404).json({
                message: "Patient Not Found"
            });
        }
        await patient.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Patient Deleted Successfully"
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Delete Patient"
        });
    }
};

// PATIENT DASHBOARD UI DATA
exports.getPatientUI = async (req, res) => {

    try {
        const totalPatients = await Patient.countDocuments();
        const activePatients = await Patient.countDocuments({
            status: "ACTIVE"
        });
        const inactivePatients = await Patient.countDocuments({
            status: "INACTIVE"
        });
        return res.status(200).json({
            totalPatients,
            activePatients,
            inactivePatients
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Patient UI Data"
        });
    }
};


