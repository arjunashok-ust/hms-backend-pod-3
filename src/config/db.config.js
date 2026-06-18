const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGO_URL)
    .then(console.log("mongo db connected established"))
    .catch((err) => console.log(err));
}

module.exports = { connectDB };