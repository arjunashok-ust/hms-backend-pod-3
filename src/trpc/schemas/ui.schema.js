const { z } = require('zod');
const { objectIdSchema } = require('./common.schema');

const roleOptionSchema = z.object({ _id: objectIdSchema, role_name: z.string() });

const departmentOptionSchema = z.object({ _id: objectIdSchema, department_name: z.string() });

const specializationOptionSchema = z.object({
    _id: objectIdSchema,
    specialization_id: z.number().nullish(),
    specialization_name: z.string(),
});

module.exports = {
    rolesOutput: z.array(roleOptionSchema),
    departmentsOutput: z.array(departmentOptionSchema),
    specializationsOutput: z.array(specializationOptionSchema),
};
