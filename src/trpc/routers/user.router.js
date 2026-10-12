const { router, permissionProcedure } = require('../trpc');
const userService = require('../../services/user.service');
const { PERMISSIONS: P } = require('../../constants/permissions.constants');
const schema = require('../schemas/user.schema');

// Patients reach some of these (own profile, doctor lookups), so the services enforce
// "a patient only sees their own data"; the back-office ones are guarded by permission only.
const userRouter = router({
    getUserProfile: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.emailInput)
        .output(schema.employeeProfileOutput)
        .query(({ input, ctx }) => userService.getEmployeeProfile(ctx.user, input)),

    getSingleUser: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.emailInput)
        .output(schema.employeeProfileOutput)
        .query(({ input, ctx }) => userService.getEmployeeProfile(ctx.user, input)),

    getPatients: permissionProcedure(P.VIEW_PATIENT)
        .input(schema.getPatientsInput)
        .output(schema.patientListOutput)
        .query(({ input }) => userService.getPatients(input)),

    // permission mirrors the REST route (view:patient)
    deletePatient: permissionProcedure(P.VIEW_PATIENT)
        .input(schema.patientIdInput)
        .output(schema.messageOutput)
        .mutation(({ input, ctx }) => userService.deletePatient(ctx.user, input)),

    getPatientProfile: permissionProcedure(P.VIEW_PATIENT)
        .input(schema.emailInput)
        .output(schema.patientProfileOutput)
        .query(({ input, ctx }) => userService.getPatientProfile(ctx.user, input)),

    getPatientId: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.emailInput)
        .output(schema.patientIdOutput)
        .query(({ input, ctx }) => userService.getPatientId(ctx.user, input)),

    getAvailableTimeSlots: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.getAvailableTimeSlotsInput)
        .output(schema.availableSlotsOutput)
        .query(({ input }) => userService.getAvailableTimeSlots(input)),

    updatePatientProfile: permissionProcedure(P.EDIT_PROFILE)
        .input(schema.updatePatientProfileInput)
        .output(schema.messageOutput)
        .mutation(({ input, ctx }) => userService.updatePatientProfile(ctx.user, input)),

    getPatientsBySearch: permissionProcedure(P.VIEW_PATIENT)
        .input(schema.searchInput)
        .output(schema.patientsOutput)
        .query(({ input }) => userService.getPatientsBySearch(input)),

    getDoctorsBySearch: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.searchInput)
        .output(schema.doctorsOutput)
        .query(({ input }) => userService.getDoctorsBySearch(input)),

    getPatientById: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.patientIdInput)
        .output(schema.patientOutput)
        .query(({ input, ctx }) => userService.getPatientById(ctx.user, input)),

    getDoctorById: permissionProcedure(P.VIEW_PROFILE)
        .input(schema.doctorIdInput)
        .output(schema.doctorOutput)
        .query(({ input }) => userService.getDoctorById(input)),
});

module.exports = { userRouter };
