const Employee = require('../models/employee');
const User = require('../models/user');

const getAllEmployees = async (req, res) => {
  try {

    // ✅ Get all users with employee data
    const users = await User.find()
      .populate("employeeId");

    // ✅ Process & filter data
    const employees = users

      // ✅ remove users without employee record
      .filter(user => user.employeeId)

      // ✅ remove Admins based on designation
      .filter(user => 
        user.employeeId.designation !== "Admin"
      )

      // ✅ map clean response
      .map(user => ({
        id: user._id,
        employeeCode: user.employeeId.employeeCode,
        email: user.email,
        name: user.employeeId.name,
        department: user.employeeId.department,
        designation: user.employeeId.designation,
        status: user.employeeId.status || "Inactive"
      }));

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees
    });

  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getAllEmployees };
