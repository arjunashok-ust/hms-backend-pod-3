/**
 * @file verifyEmailController.js
 * @description
 * This file contains the controller function for handling the email verification process.
 * This file contains the controller for handling email verification.
 *
 * @overview
 * This controller manages the logic for verifying a user's email address using a token.
 * It is triggered when a user clicks the verification link sent to their email.
 * The controller validates the email and token against the `Users` model, ensuring the token is not expired.
 * Upon success, it updates the user's status and may trigger a notification email. If an error occurs, it is thrown to be caught by `asyncHandler` and forwarded to the global `errorMiddleware`.
 *
 * Connections:
 *   API Request -> emailVerificationRoutes -> asyncHandler -> VERIFYEMAILCONTROLLER.JS -> [Users Model, sendMail utility]
 *   VERIFYEMAILCONTROLLER.JS -> (on error) -> asyncHandler -> errorMiddleware
 */
const sendMail = require("../utils/sendMail");
const Users = require("../models/Users");
const ERR = require("../utils/errors.utils");

/**
 * @route   GET /api/email/verify-email
 * @desc    Verifies a user's email address using a token from the query string.
 * @access  Public
 */
exports.verifyEmail = async (req, res) => {
  const { email, token } = req.query;

  if (!email || !token) {
    throw ERR.invalidRequest(
      "Invalid verification link.",
      "INVALID_EMAIL_VERIFICATION_LINK",
    );
  }

  const user = await Users.findOne({
    email,
    verification_token: token,
    verification_expiry: { $gt: Date.now() },
  });

  if (!user) {
    throw ERR.invalidVerificationToken();
  }

  if (user.isEmailVerified) {
    return res.status(200).json({ message: "Email is already verified." });
  }

  user.isEmailVerified = true;
  user.verification_token = undefined;
  user.verification_expiry = undefined;
  await user.save();
  const messageIfSelfSignup = " and requires your approval";

  if (user.status === "ADMIN_APPROVAL_PENDING") {
    try {
      await sendMail({
        to: process.env.ADMIN_EMAIL,
        subject: "HMS Employee Credentials - Approval Required",
        htmlContent: `
            <h2>Hello Admin</h2>
            <p>An employee [${user.employeeID}] profile has successfully verified their email${messageIfSelfSignup}.</p>
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
};
