const { router, publicProcedure, protectedProcedure } = require('../trpc');
const authService = require('../../services/auth.service');
const { setRefreshCookie, clearRefreshCookie, getRefreshCookie } = require('../../utils/cookie.utils');
const { messageOutput } = require('../schemas/common.schema');
const schema = require('../schemas/auth.schema');

// The refresh token travels in an httpOnly cookie only, it is never part of a response body.
const authRouter = router({
    signUp: publicProcedure
        .input(schema.signUpInput)
        .output(schema.signUpOutput)
        .mutation(({ input }) => authService.signUp(input)),

    patientSignUp: publicProcedure
        .input(schema.patientSignUpInput)
        .output(schema.signUpOutput)
        .mutation(({ input }) => authService.patientSignUp(input)),

    login: publicProcedure
        .input(schema.loginInput)
        .output(schema.loginOutput)
        .mutation(async ({ input, ctx }) => {
            const { refreshToken, ...session } = await authService.login(input);
            setRefreshCookie(ctx.res, refreshToken);
            return session;
        }),

    refreshToken: publicProcedure
        .output(schema.refreshTokenOutput)
        .mutation(async ({ ctx }) => {
            const { token, refreshToken } = await authService.refreshSession(getRefreshCookie(ctx.req));
            setRefreshCookie(ctx.res, refreshToken);
            return { token };
        }),

    logout: protectedProcedure
        .output(messageOutput)
        .mutation(async ({ ctx }) => {
            const result = await authService.logout(ctx.user);
            clearRefreshCookie(ctx.res);
            return result;
        }),

    setPassword: protectedProcedure
        .input(schema.setPasswordInput)
        .output(messageOutput)
        .mutation(({ input, ctx }) => authService.setPassword(ctx.user, input)),

    verifyEmail: publicProcedure
        .input(schema.verifyEmailInput)
        .output(messageOutput)
        .mutation(({ input }) => authService.verifyEmail(input)),

    getPermissions: publicProcedure
        .input(schema.getPermissionsInput)
        .output(schema.permissionsOutput)
        .query(({ input }) => authService.getPermissions(input)),

    resetPassword: publicProcedure
        .input(schema.resetPasswordInput)
        .output(messageOutput)
        .mutation(({ input }) => authService.resetPassword(input)),

    verifyResetPassword: publicProcedure
        .input(schema.verifyResetPasswordInput)
        .output(messageOutput)
        .mutation(({ input }) => authService.verifyResetPassword(input)),
});

module.exports = { authRouter };
