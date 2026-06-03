const app = require('./app');
const db = require('./config/db.config');

db.connectDB();

app.listen(process.env.PORT, () => {
    console.log(`server running at https://localhost:${process.env.PORT}`);
});