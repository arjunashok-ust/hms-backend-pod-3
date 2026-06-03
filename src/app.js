require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const db = require('./config/db.config');

const app = new express();

app.use(helmet());
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(morgan('dev'));

app.use(express.json());

const authRoute = require('./routes/auth.route');
const userRoute = require('./routes/user.route');

app.use('/auth', authRoute);
app.use('/user', userRoute);

module.exports = app;
