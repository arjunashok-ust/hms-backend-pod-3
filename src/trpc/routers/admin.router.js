const { router, staffProcedure } = require('../trpc');
const adminService = require('../../services/admin.service');
const { PERMISSIONS: P } = require('../../constants/permissions.constants');
const { messageOutput } = require('../schemas/common.schema');
const schema = require('../schemas/admin.schema');

// Back-office only: every procedure rejects patients before the permission check.
const adminRouter = router({
    getDashboardData: staffProcedure(P.VIEW_DASHBOARD)
        .output(schema.dashboardOutput)
        .query(() => adminService.getDashboardData()),

    getAllUsers: staffProcedure(P.VIEW_DASHBOARD)
        .input(schema.getAllUsersInput)
        .output(schema.employeeListOutput)
        .query(({ input }) => adminService.getAllUsers(input)),

    getUsers: staffProcedure(P.VIEW_DASHBOARD)
        .output(schema.usersOutput)
        .query(() => adminService.getUsers()),

    getUserEmployee: staffProcedure(P.VIEW_DASHBOARD, P.EDIT_PROFILE)
        .input(schema.getUserEmployeeInput)
        .output(schema.employeeProfileListOutput)
        .query(({ input }) => adminService.getUserEmployee(input)),

    approveUser: staffProcedure(P.APPROVE_USER)
        .input(schema.employeeIdInput)
        .output(schema.employeeIdMessageOutput)
        .mutation(({ input }) => adminService.approveUser(input)),

    rejectUser: staffProcedure(P.REJECT_USER)
        .input(schema.employeeIdInput)
        .output(schema.employeeIdMessageOutput)
        .mutation(({ input }) => adminService.rejectUser(input)),

    // permission mirrors the REST route (view:employee)
    deleteUserProfile: staffProcedure(P.VIEW_EMPLOYEE)
        .input(schema.employeeIdInput)
        .output(schema.employeeIdMessageOutput)
        .mutation(({ input, ctx }) => adminService.deleteUserProfile(ctx.user, input)),

    updateUserProfile: staffProcedure(P.EDIT_EMPLOYEE, P.EDIT_PROFILE)
        .input(schema.updateUserProfileInput)
        .output(messageOutput)
        .mutation(({ input }) => adminService.updateUserProfile(input)),

    getRolesData: staffProcedure(P.VIEW_PERMISSION)
        .output(schema.rolesOutput)
        .query(() => adminService.getRolesData()),

    updateRole: staffProcedure(P.EDIT_PERMISSION)
        .input(schema.updateRoleInput)
        .output(schema.roleOutput)
        .mutation(({ input }) => adminService.updateRole(input)),
});

module.exports = { adminRouter };
