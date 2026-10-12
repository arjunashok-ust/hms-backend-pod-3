// drops undefined values so partial updates never overwrite fields with undefined/null
const pickDefined = (source) =>
    Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined));

module.exports = { pickDefined };
