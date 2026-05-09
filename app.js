require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
//const { swaggerUi, swaggerDocument } = require("../swagger/swagger");


// const employee = require("./src/models/Employee");
// const bill = require("./src/models/Bill");
// const counter = require("./src/models/Counter");
//const appointment = require("./src/models/Appointment");
// const medicalRecord = require("./src/models/MedicalRecord");
// const patient = require("./src/models/Patient");
// const payment = require("./src/models/Payment");
// const user = require("./src/models/User");

// app => server object
const app = express();
// Used for secure http headers
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

//middleware which logs requests
app.use(morgan("dev"));
// Read JSON data sent from frontend/Postman and make it available in req.body.
app.use(express.json());

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerDocument, {
//     customCssUrl:
//       "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css",
//     customJs: [
//       "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js",
//       "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js",
//     ],
//   }),
// );


app.get("/", (req, res) => res.json({ message: "API running" }));

const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

module.exports = app;
