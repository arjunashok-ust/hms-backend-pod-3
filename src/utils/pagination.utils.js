const toSkip = ({ page, limit }) => (page - 1) * limit;

const buildPage = ({ data, total, page, limit }) => ({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
});

module.exports = { toSkip, buildPage };
