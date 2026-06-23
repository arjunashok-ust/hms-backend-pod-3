const Employees = require("../models/Employees");
const Users = require("../models/Users");

exports.getAllEmployees = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    let matchStage = {
      name: { $exists: true, $ne: "" },
      employeeCode: { $exists: true, $ne: null },
    };

    if (req.query.department) {
      matchStage.department = req.query.department;
    }
    if (req.query.status) {
      matchStage.status = req.query.status;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      matchStage.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex },
      ];
    }

    const totalStats = await Employees.aggregate([
      {
        $match: {
          name: { $exists: true, $ne: "" },
          employeeCode: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "ADMIN_APPROVAL_PENDING"] }, 1, 0],
            },
          },
          verified: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
          inactive: {
            $sum: { $cond: [{ $eq: ["$status", "INACTIVE"] }, 1, 0] },
          },
          firstLogin: {
            $sum: {
              $cond: [{ $eq: ["$status", "PASSWORD_CHANGE_PENDING"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const stats =
      totalStats.length > 0
        ? totalStats[0]
        : { total: 0, pending: 0, verified: 0, inactive: 0, firstLogin: 0 };

    const employees = await Employees.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
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
          ],
        },
      },
    ]);

    const total = employees[0].metadata[0] ? employees[0].metadata[0].total : 0;
    const data = employees[0].data;

    res.status(200).json({
      success: true,
      data: data,
      stats: stats,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employee directory" });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await Users.findOne({ employeeID: id });
    if (targetUser?.role === "ADMIN") {
      const userPermissions = req.user?.permissions || [];
      if (!userPermissions.includes("DELETE_ADMIN")) {
        return res.status(403).json({
          message:
            "Access Denied: You lack the DELETE_ADMIN permission required to remove an Administrator.",
        });
      }
    }

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

    const targetUser = await Users.findOne({ employeeID: id });
    if (targetUser?.role === "ADMIN") {
      const userPermissions = req.user?.permissions || [];
      if (!userPermissions.includes("UPDATE_ADMIN")) {
        return res.status(403).json({
          message:
            "Access Denied: You lack the UPDATE_ADMIN permission required to modify an Administrator.",
        });
      }
    }

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

exports.rejectEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const emp = await Employees.findOneAndUpdate(
      { employeeCode: id },
      { $set: { status: "INACTIVE" } },
      { new: true, runValidators: true },
    );

    const user = await Users.findOneAndUpdate(
      { employeeID: id },
      { $set: { status: "INACTIVE" } },
      { new: true, runValidators: true },
    );

    if (!emp || !user) {
      return res
        .status(404)
        .json({ message: "Employee or User account record missing" });
    }

    res.status(200).json({ message: "Employee rejected successfully" });
  } catch (error) {
    console.error("Error rejecting employee:", error);
    res
      .status(500)
      .json({ message: error.message || "Approval rejection failed" });
  }
};
