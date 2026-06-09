const Patient = require("../models/Patient");

/* ================================
   GET ALL PATIENTS
================================ */

exports.getAllPatients = async (req, res) => {
  try {

    const patients = await Patient.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      message: "Server Error During Get Patients",
    });

  }
};