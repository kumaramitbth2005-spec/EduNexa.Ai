exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, ...data });
};

exports.errorResponse = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};

exports.paginateQuery = (query, page = 1, limit = 20) => ({
  skip: (page - 1) * limit,
  limit: Number(limit),
});

