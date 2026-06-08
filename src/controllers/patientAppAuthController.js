const Patient = require("../models/Patient");
const User = require("../models/User");
const Employee = require("../models/Employee");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Patient SignUp
exports.patientSignup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      gender,
      date_of_birth,
      bloodGroup,
      allergies,
      address,
      emergencyContact,
    } = req.body;

    const existingUser =
      await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    const password_hash =
      await bcrypt.hash(password, 12);

    const patient =
      await Patient.create({
        email,
        name,
        phone,
        gender,
        date_of_birth,
        bloodGroup,
        allergies,
        address,
        emergencyContact,
        status: true,
      });

    await User.create({
      email,
      password_hash,
      role: "patient",
      status: true,
      isFirstLogin: false,
    });

    return res.status(201).json({
      message: "Patient Registered Successfully",
      patient,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error During Signup",
    });
  }
};

//Patient Login
exports.patientLogin = async (req, res) => {
  try {
    const { email, password } =
      req.body;

    const user =
      await User.findOne({
        email,
        role: "patient",
      });

    if (!user) {
      return res.status(404).json({
        message: "Patient Not Found",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    const patient =
      await Patient.findOne({ email });

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn:
          process.env.JWT_EXPIRES_IN,
      }
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      user,
      patient,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error During Login",
    });
  }
};

//Update Patient Profile
exports.updatePatientProfile =
  async (req, res) => {
    try {
      const patient =
        await Patient.findOne({
          email: req.user.email,
        });

      if (!patient) {
        return res.status(404).json({
          message: "Patient Not Found",
        });
      }

      Object.assign(
        patient,
        req.body
      );

      await patient.save();

      return res.status(200).json({
        message:
          "Profile Updated Successfully",
        patient,
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        message:
          "Server Error During Update",
      });
    }
  };