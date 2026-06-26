const Patient = require("../models/Patients");
const User = require("../models/Users");
const Appointments = require("../models/Appointments")
const bcrypt = require("bcryptjs");
const ERR = require("../utils/errors.utils");

exports.getAllPatients = async (req, res) => {
  const page = Number.parseInt(req.query.page) || 1;
  const limit = Number.parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  let matchStage = {status:{$ne:"DELETED"}};

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, "i");
    matchStage.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { UHID: searchRegex },
      { phone: searchRegex },
    ];
  }

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
};

exports.createPatient = async (req, res) => {
  const newPatient = new Patient(req.body);
  await newPatient.save();
  res.status(201).json(newPatient);
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
  const { id } = req.params;
  const { role, email } = req.user || {};

  const targetPatient = await Patient.findOne({ UHID: id });
  if (!targetPatient) throw ERR.patientNotFound();

  const isPatientRole = role === "PATIENT";
  if (isPatientRole && targetPatient.email !== email) {
    throw ERR.forbidden(
      "Access Denied: You are not authorized to mutate this profile record.",
      "PATIENT_ACCESS_FORBIDDEN",
    );
  }

  const cleanUpdatePayload = isPatientRole
    ? buildPatientUpdatePayload(req.body, targetPatient.address)
    : buildStaffUpdatePayload(req.body);

    console.log(cleanUpdatePayload)

  const updated = await Patient.findOneAndUpdate(
    { UHID: id },
    { $set: cleanUpdatePayload },
    { new: true, runValidators: true },
  );

  res.status(200).json(updated);
};

exports.deletePatient = async (req, res) => {
  const { id } = req.params;
  const deleted = await Patient.findOneAndUpdate(
    { UHID: id },
    { $set: { status: "DELETED" } },
    { new: true },
  );

   const deletedUser = await User.findOneAndUpdate(
     { patientUHID: id },
     { $set: { status: "DELETED" } },
     { new: true },
   );

  if (!deleted || !deletedUser) throw ERR.patientNotFound();

  const deletedPatientAppointments = await Appointments.updateMany(
    { patientId: id },
    { $set: { status: "Deleted" } },
  );

  const deletedCount = deletedPatientAppointments.modifiedCount;

  res.status(200).json({
    message: `Patient permanently deleted.No of appointemnts deleted:${deletedCount}`,
  });
};

exports.createPatientFromMobile = async (req, res) => {
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
  if (existingUser) throw ERR.emailAlreadyExists();

  const existingPatient = await Patient.findOne({
    email: email.toLowerCase(),
  });
  if (existingPatient) throw ERR.patientAlreadyExists();

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
    patientUHID: newPatient.UHID,
  });

  return res.status(201).json({
    message: "Patient registered successfully",
    patientUHID: newUser.patientUHID,
  });
};
