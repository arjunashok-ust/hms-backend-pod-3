/**
 * @file server.js
 * @description
 * This file is the main entry point that starts the Node.js server.
 *
 * @overview
 * This script imports the configured Express `app` instance and starts it listening on the specified PORT.
 * It also sets up crucial global process-level error handlers for `unhandledRejection` and `uncaughtException`.
 * These handlers act as a final safety net to log catastrophic errors and gracefully shut down the server, preventing it from remaining in an unstable state.
 *
 * Connections:
 *   Node.js process -> SERVER.JS -> app.js
 */
const app = require("./app");
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  server.close(() => {
    process.exit(1);
  });
});
