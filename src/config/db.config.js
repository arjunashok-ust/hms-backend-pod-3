const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGO_URI)
    .then(console.log("mongo db connected!"))
    .catch((err) => console.log(err));
}

module.exports = { connectDB };