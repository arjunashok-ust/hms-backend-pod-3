const { router } = require("./trpc");
const { medicalRecordRouter } = require("./routers/medical-record.router");

const appRouter = router({
  medicalRecord: medicalRecordRouter,
});

module.exports = {
  appRouter,
};
