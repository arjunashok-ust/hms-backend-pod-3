require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler.middleware');

const db = require('./config/db.config');

const app = new express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONT_END_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

const authRoute = require('./routes/auth.route');
const userRoute = require('./routes/user.route');
const adminRoute = require('./routes/admin.route');
const nodeRoute = require('./routes/node.route');
const uiRoute = require('./routes/ui.route');
const appointmentRoute = require('./routes/appointment.route');
const medicalRecordRoute = require('./routes/medical-record.route');

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/admin', adminRoute);
app.use('/ui', uiRoute);
app.use('/node', nodeRoute);
app.use('/appointment', appointmentRoute);
app.use('/medicalRecord', medicalRecordRoute);

app.use(errorHandler);

module.exports = app;
