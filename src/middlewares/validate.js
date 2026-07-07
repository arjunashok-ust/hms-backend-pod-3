/**
 * @file validate.js
 * @description
 * This file contains the middleware function for handling validation results from express-validator.
 *
 * @overview
 * This middleware is designed to be placed after a chain of `express-validator` checks in a route definition.
 * It inspects the request for any validation errors collected by `validationResult`.
 * If errors are found, it stops the request chain and sends a 422 Unprocessable Entity response containing the details of the validation errors.
 * If there are no errors, it passes control to the next middleware in the stack.
 *
 * Visual Connections:
 *   API Request -> route -> validation (e.g., loginValidation) -> VALIDATE.JS -> (on success) -> [asyncHandler | controller]
 *   VALIDATE.JS -> (on error) -> API Response
 */
const { validationResult } = require("express-validator");

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

module.exports = validate;
