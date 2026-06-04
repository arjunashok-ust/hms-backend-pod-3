const app = require("./app");
const db = require("./config/db.config");

db.connectDB();

app.listen(process.env.PORT || 5000, () => {
  console.log(`server running at http://localhost:${process.env.PORT}`);
});