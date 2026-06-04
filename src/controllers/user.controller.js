const userModel = require("../models/User");

//PROFILE
exports.profile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-passwordHash -__v");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                role: user.roles,
                last_login: user.lastLoginAt,
                created_at: user.createdAt,
            }
        });
    } catch (err) {
        console.error("Profile error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}