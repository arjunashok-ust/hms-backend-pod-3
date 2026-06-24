const Users = require("../models/Users");
const Employees = require("../models/Employees");
const ERR = require("../utils/errors.utils");

exports.deleteProfile = async (req, res) => {
  const user = await Users.findOne({ email: req.user.email }).select(
    "-__v -passwordHash",
  );
  if (!user) throw ERR.userNotFound();

  const profile = await Employees.findOne({ email: req.user.email }).select(
    "-__v",
  );
  if (!profile) throw ERR.profileNotFound();

  res.status(200).json({ user: profile });
};

exports.getMe = async (req, res) => {
  const user = await Users.findOne({ email: req.user.email }).select(
    "-__v -passwordHash",
  );
  if (!user) throw ERR.userNotFound();

  const profile = await Employees.findOne({ email: req.user.email }).select(
    "-__v",
  );
  if (!profile) throw ERR.profileNotFound();

  res.status(200).json({ user: profile });
};
