require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { trpcHandler } = require('./trpc/handler');
const errorHandler = require('./middleware/errorHandler.middleware');


const app = new express();

// render terminates tls in front of the app, needed for secure cookies and correct client ips
app.set('trust proxy', 1);

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

// liveness probe for render's health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/admin', adminRoute);
app.use('/ui', uiRoute);
app.use('/node', nodeRoute);
app.use('/appointment', appointmentRoute);
app.use('/medicalRecord', medicalRecordRoute);

app.use('/trpc', trpcHandler);

app.use(errorHandler);

module.exports = app;
