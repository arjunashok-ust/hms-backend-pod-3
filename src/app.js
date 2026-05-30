require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const db = require("./config/db");
const cors = require("cors");
//routes
const authRouter = require("./routes/auth.route");
const appointmentRouter = require("./routes/appointment.route");
const adminRouter = require("./routes/admin.route");
const nodeRouter = require("./routes/node.route");
const uiRouter = require("./routes/ui.route");
const userRouter = require("./routes/user.route");

const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: false 
    })
)

db.connectDB();

app.get("/", (req, res) => res.json({ message: "API Running " }));

//route implementation
app.use("/hms/auth", authRouter);
app.use("/hms/appointment", appointmentRouter);
app.use("/hms/admin", adminRouter);
app.use("/hms/node", nodeRouter);
app.use("/hms/ui", uiRouter);
app.use("/hms/user", userRouter);

module.exports = app;