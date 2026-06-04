const sendMail = require("../utils/sendMail");

exports.verifyEmail = async (req, res) => {
  try {
    const { email, token } = req.query;

    if (!email || !token) {
      return res.status(400).json({ message: "Invalid verification link." });
    }

    const user = await Users.findOne({
      email,
      verification_token: token,
      verification_expiry: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired." });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email is already verified." });
    }

    user.isEmailVerified = true;
    user.verification_token = undefined;
    user.verification_expiry = undefined;
    await user.save();
    if (user.status === "ADMIN_APPROVAL_PENDING") {
      try {
        await sendMail({
          to: process.env.ADMIN_EMAIL,
          subject: "HMS Employee Credentials - Approval Required",
          htmlContent: `
            <h2>Hello Admin</h2>
            <p>An employee profile has successfully verified their email and now requires your approval.</p>
            <p>Kindly check the system and take necessary steps.</p>
            <p><strong>Employee Id:</strong> ${user.employeeID}</p>
          `,
        });
      } catch (mailError) {
        console.error(
          "Mail Service Error (Admin Notification):",
          mailError.message,
        );
      }

      return res.status(200).json({
        message:
          "Email successfully verified. Your account is now pending Admin approval.",
      });
    }

    res.status(200).json({
      message:
        "Email successfully verified. You may now log in with your temporary password.",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during verification." });
  }
};
