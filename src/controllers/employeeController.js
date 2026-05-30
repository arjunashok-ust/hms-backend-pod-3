const Employees = require("../models/Employees");
const Users = require("../models/Users");

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employees.aggregate([
      { 
        $match: { 
          name: { $exists: true, $ne: "" },
          employeeCode: { $exists: true, $ne: null }
        } 
      },
      { $sort: { createdAt: -1 } },
    
      {
        $lookup: {
          from: "users", 
          localField: "employeeCode",
          foreignField: "employeeID",
          as: "userInfo"
        }
      },
      
      {
        $addFields: {
          role: { $arrayElemAt: ["$userInfo.role", 0] },
          isActivated: { $arrayElemAt: ["$userInfo.isActivated", 0] }, 
          status: { $ifNull: ["$status", false] } 
        }
      },
      
      {
        $project: {
          userInfo: 0, 
          __v: 0 
        }
      }
    ]);

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employee directory" });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employees.aggregate([
      { 
        $match: { 
          name: { $exists: true, $ne: "" },
          employeeCode: { $exists: true, $ne: null }
        } 
      },
      { $sort: { createdAt: -1 } },
    
      {
        $lookup: {
          from: "users", 
          localField: "employeeCode",
          foreignField: "employeeID",
          as: "userInfo"
        }
      },
      
      {
        $addFields: {
          role: { $arrayElemAt: ["$userInfo.role", 0] },
          isActivated: { $arrayElemAt: ["$userInfo.isActivated", 0] }, 
          status: { $ifNull: ["$status", false] } 
        }
      },
      
      {
        $project: {
          userInfo: 0, 
          __v: 0 
        }
      }
    ]);

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Failed to fetch employee directory" });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params; 
    const updates = req.body;
    const updatedProfile = await Employees.findOneAndUpdate(
      { employeeCode: id },
      { $set: updates },
      { new: true } 
    );

    if (!updatedProfile) return res.status(404).json({ message: "Employee not found" });

    if (updates.role || updates.status !== undefined || updates.email) {
      await Users.findOneAndUpdate(
        { employeeID: id },
        { 
          $set: { 
            role: updates.role, 
            status: updates.status,
            email: updates.email 
          } 
        }
      );
    }

    res.status(200).json({ message: "Employee updated successfully", employee: updatedProfile });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Failed to update employee" });
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

exports.approveEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    await Employees.findOneAndUpdate(
      { employeeCode: id },
      { $set: { status: true } }
    );

    const user = await Users.findOneAndUpdate(
      { employeeID: id },
      { $set: { isActivated: true } },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Employee approved successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Approval failed" });
  }
};