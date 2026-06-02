const isAdmin = async (req, res, next) => {
  try {

    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Only Admin can create users",
      });
    }

    next();

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Role authorization failed",
    });

  }
};
module.exports = isAdmin;