const { router, permissionProcedure } = require('../trpc');
const appointmentService = require('../../services/appointment.service');
const { PERMISSIONS: P } = require('../../constants/permissions.constants');
const schema = require('../schemas/appointment.schema');

const appointmentRouter = router({
    createAppointment: permissionProcedure(P.CREATE_APPOINTMENT)
        .input(schema.createAppointmentInput)
        .output(schema.createAppointmentOutput)
        .mutation(({ input, ctx }) => appointmentService.createAppointment(ctx.user, input)),

    getAllAppointments: permissionProcedure(P.VIEW_APPOINTMENT)
        .input(schema.getAllAppointmentsInput)
        .output(schema.appointmentListOutput)
        .query(({ input, ctx }) => appointmentService.getAllAppointments(ctx.user, input)),

    getDoctors: permissionProcedure(P.VIEW_APPOINTMENT)
        .output(schema.doctorsOutput)
        .query(() => appointmentService.getDoctors()),

    getAppointmentUiData: permissionProcedure(P.VIEW_APPOINTMENT)
        .output(schema.appointmentStatsOutput)
        .query(() => appointmentService.getAppointmentUiData()),

    getAppointmentsByPatientId: permissionProcedure(P.VIEW_APPOINTMENT)
        .input(schema.getAppointmentsByPatientIdInput)
        .output(schema.appointmentListOutput)
        .query(({ input, ctx }) => appointmentService.getAppointmentsByPatientId(ctx.user, input)),

    getDoctorByEmployeeId: permissionProcedure(P.VIEW_APPOINTMENT)
        .input(schema.employeeIdInput)
        .output(schema.doctorOutput)
        .query(({ input }) => appointmentService.getDoctorByEmployeeId(input)),

    getAppointmentByDoctorIdOrPatientId: permissionProcedure(P.VIEW_PATIENT)
        .input(schema.getAppointmentByDoctorIdOrPatientIdInput)
        .output(schema.appointmentsOutput)
        .query(({ input, ctx }) => appointmentService.getAppointmentByDoctorIdOrPatientId(ctx.user, input)),

    editAppointment: permissionProcedure(P.EDIT_APPOINTMENT)
        .input(schema.editAppointmentInput)
        .output(schema.messageOutput)
        .mutation(({ input, ctx }) => appointmentService.editAppointment(ctx.user, input)),

    editAppointmentStatus: permissionProcedure(P.APPROVE_APPOINTMENT)
        .input(schema.editAppointmentStatusInput)
        .output(schema.messageOutput)
        .mutation(({ input }) => appointmentService.editAppointmentStatus(input)),

    deleteAppointment: permissionProcedure(P.DELETE_APPOINTMENT)
        .input(schema.appointmentIdInput)
        .output(schema.messageOutput)
        .mutation(({ input, ctx }) => appointmentService.deleteAppointment(ctx.user, input)),
});

module.exports = { appointmentRouter };
