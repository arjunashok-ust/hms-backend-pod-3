require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const db = require('./config/db.config');

const app = new express();
// middleware for web security
app.use(helmet());
// cross origin resource sharing
app.use(cors({
    // front end url
    origin: process.env.FRONT_END_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));
// logging, dev -> colored logs
app.use(morgan('dev'));
// enables server to read json responses
app.use(express.json());
// routes
const authRoute = require('./routes/auth.route');
const userRoute = require('./routes/user.route');
// route caller
app.use('/auth', authRoute);
app.use('/user', userRoute);

module.exports = app;
