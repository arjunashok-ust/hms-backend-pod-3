const { router } = require('./trpc');
const { authRouter } = require('./routers/auth.router');
const { userRouter } = require('./routers/user.router');
const { adminRouter } = require('./routers/admin.router');
const { appointmentRouter } = require('./routers/appointment.router');
const { medicalRecordRouter } = require('./routers/medical-record.router');
const { nodeRouter } = require('./routers/node.router');
const { uiRouter } = require('./routers/ui.router');

// procedures are addressed as <namespace>.<procedure>, e.g. medicalRecord.getMedicalRecords
const appRouter = router({
    auth: authRouter,
    user: userRouter,
    admin: adminRouter,
    appointment: appointmentRouter,
    medicalRecord: medicalRecordRouter,
    node: nodeRouter,
    ui: uiRouter,
});

module.exports = { appRouter };
