require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const db = require('./config/db');

const app = new express();
// middleware for web security
app.use(helmet());
// cross origin resource sharing
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET','POST','PUT','DELETE'],
    credentials: false,
    allowedHeaders: ['Content-Type'],
}));
// logging, dev -> colored logs
app.use(morgan('dev'));
// enables server to read json responses
app.use(express.json());

// routes
const authRoute = require('./routes/authRoutes');
const appointmentRoute = require('./routes/appointmentRoutes');
const dashboardRoute = require('./routes/dashboardRoutes');
const employeeRoute = require('./routes/employeeRoutes');
const patientRoute = require('./routes/patientRoutes.app');
// route caller
app.use('/auth',authRoute);

app.use('/apppointment',appointmentRoute);
app.use('/dashboard', dashboardRoute);
app.use('/employee', employeeRoute);
app.use('/patientApi', patientRoute);

module.exports = app;
