const Patient = require("../models/Patients");
const User = require("../models/Users");
const bcrypt = require("bcryptjs");

exports.getAllPatients = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let matchStage = {};

    // Apply search filter if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { UHID: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Run Count and Find concurrently for performance
    const [total, patients] = await Promise.all([
      Patient.countDocuments(matchStage),
      Patient.find(matchStage).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: patients,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching patients", error: err.message });
  }
};

// ... keep all other functions (createPatient, updatePatient, etc.) exactly the same below
exports.createPatient = async (req, res) => {
  try {
    const newPatient = new Patient(req.body);
    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error creating patient", error: err.message });
  }
};

const buildPatientUpdatePayload = (body, currentAddress) => {
  const {
    phone,
    gender,
    dob,
    bloodGroup,
    allergies,
    emergencyContact,
    address,
  } = body;

  const payload = {};

  if (phone) payload.phone = phone.trim();
  if (gender) payload.gender = gender;
  if (dob) payload.dob = dob;
  if (bloodGroup !== undefined) payload.bloodGroup = bloodGroup;
  if (allergies !== undefined) payload.allergies = allergies;

  if (emergencyContact !== undefined) {
    payload.emergencyContact =
      typeof emergencyContact === "string"
        ? emergencyContact.trim()
        : emergencyContact;
  }

  if (address) {
    payload.address = {
      line1: address.line1?.trim() || currentAddress?.line1,
      line2: address.line2?.trim() || currentAddress?.line2,
      state: address.state?.trim() || currentAddress?.state,
      pincode: address.pincode || currentAddress?.pincode,
    };
  }

  return payload;
};

const buildStaffUpdatePayload = (body) => {
  const payload = { ...body };
  delete payload._id;
  delete payload.UHID;
  return payload;
};

exports.updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, email } = req.user || {};

    const targetPatient = await Patient.findOne({ UHID: id });
    if (!targetPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const isPatientRole = role === "PATIENT";

    if (isPatientRole && targetPatient.email !== email) {
      return res.status(403).json({
        message:
          "Access Denied: You are not authorized to mutate this profile record.",
      });
    }

    const cleanUpdatePayload = isPatientRole
      ? buildPatientUpdatePayload(req.body, targetPatient.address)
      : buildStaffUpdatePayload(req.body);

    const updated = await Patient.findOneAndUpdate(
      { UHID: id },
      { $set: cleanUpdatePayload },
      { new: true, runValidators: true },
    );

    res.status(200).json(updated);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Update operation failed", error: err.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Patient.findOneAndDelete({ UHID: id });
    if (!deleted) return res.status(404).json({ message: "Patient not found" });
    res.status(200).json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

exports.createPatientFromMobile = async (req, res) => {
  try {
    const {
      name,
      phone,
      password,
      email,
      gender,
      dob,
      emergencyContact,
      address,
      bloodGroup,
      allergies,
    } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Email already registered as a user." });
    }

    const existingPatient = await Patient.findOne({
      email: email.toLowerCase(),
    });
    if (existingPatient) {
      return res
        .status(409)
        .json({ message: "Patient profile with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newPatient = await Patient.create({
      name,
      phone,
      email: email.toLowerCase(),
      gender,
      dob,
      emergencyContact,
      address,
      bloodGroup,
      allergies,
    });

    const newUser = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "PATIENT",
      status: "ACTIVE",
      patientId: newPatient.UHID,
    });

    return res.status(201).json({
      message: "Patient registered successfully",
      patientUHID: newUser.patientId,
    });
  } catch (err) {
    console.error("Critical Registration Error:", err);
    return res.status(400).json({
      message: "Database insertion failed. Check schema validation limits.",
      error: err.message,
    });
  }
};
