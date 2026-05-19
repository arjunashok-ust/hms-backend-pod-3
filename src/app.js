require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const db = require('./config/db.config');

const app = new express();

app.use(helmet());
app.use(cors({
    origin: process.env.FRONT_END_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: false,
    allowedHeaders: ['Content-Type'],
}));

app.use(morgan('dev'));
app.use(express.json());

const authRoute = require('./routes/auth.route');
const userRoute = require('./routes/user.route');
const adminRoute = require('./routes/admin.route');
const nodeRoute = require('./routes/node.route');
const homeRoute = require('./routes/home.route');

app.use("/", homeRoute);
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/admin', adminRoute);

module.exports = app;
