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
