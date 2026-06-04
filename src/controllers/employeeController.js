const Employees = require("../models/Employees");
const Users = require("../models/Users");

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employees.aggregate([
      {
        $match: {
          name: { $exists: true, $ne: "" },
          employeeCode: { $exists: true, $ne: null },
        },
      },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "users",
          localField: "employeeCode",
          foreignField: "employeeID",
          as: "userInfo",
        },
      },

      {
        $addFields: {
          role: { $arrayElemAt: ["$userInfo.role", 0] },
          status: { $ifNull: ["$status", "INACTIVE"] },
        },
      },

      {
        $project: {
          userInfo: 0,
          __v: 0,
        },
      },
    ]);

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employee directory" });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    await Employees.findOneAndDelete({ employeeCode: id });
    await Users.findOneAndDelete({ employeeID: id });

    res.status(200).json({ message: "Employee permanently deleted" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const employeeUpdates = { ...updates };
    delete employeeUpdates._id;
    delete employeeUpdates.employeeCode;
    delete employeeUpdates.role;

    const updatedProfile = await Employees.findOneAndUpdate(
      { employeeCode: id },
      { $set: employeeUpdates },
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json({ message: "Employee not found in directory" });
    }

    const userUpdates = {};
    if (updates.role !== undefined) userUpdates.role = updates.role;
    if (updates.status !== undefined) userUpdates.status = updates.status;
    if (updates.email !== undefined) userUpdates.email = updates.email;

    if (Object.keys(userUpdates).length > 0) {
      await Users.findOneAndUpdate(
        { employeeID: id },
        { $set: userUpdates },
        { new: true, runValidators: true },
      );
    }

    res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to update employee" });
  }
};

exports.approveEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const emp = await Employees.findOneAndUpdate(
      { employeeCode: id },
      { $set: { status: "ACTIVE" } },
      { new: true, runValidators: true },
    );

    const user = await Users.findOneAndUpdate(
      { employeeID: id },
      { $set: { status: "ACTIVE" } },
      { new: true, runValidators: true },
    );

    if (!emp || !user) {
      return res
        .status(404)
        .json({ message: "Employee or User account record missing" });
    }

    res.status(200).json({ message: "Employee approved successfully" });
  } catch (error) {
    console.error("Error approving employee:", error);
    res.status(500).json({ message: error.message || "Approval failed" });
  }
};
