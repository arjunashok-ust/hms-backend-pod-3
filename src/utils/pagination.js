const getPagination = (query) => {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) page = 1;
  if (!Number.isInteger(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; 

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.max(Math.ceil(totalCount / limit), 1);

  return {
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = { getPagination, buildPaginationMeta };