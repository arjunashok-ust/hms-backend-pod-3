const { router, publicProcedure } = require('../trpc');
const uiService = require('../../services/ui.service');
const schema = require('../schemas/ui.schema');

// lookup lists for the sign up forms, no session yet at that point
const uiRouter = router({
    getRoles: publicProcedure
        .output(schema.rolesOutput)
        .query(() => uiService.getRoles()),

    getDepartments: publicProcedure
        .output(schema.departmentsOutput)
        .query(() => uiService.getDepartments()),

    getSpecializations: publicProcedure
        .output(schema.specializationsOutput)
        .query(() => uiService.getSpecializations()),
});

module.exports = { uiRouter };
