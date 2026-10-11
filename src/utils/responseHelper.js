export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = 'Error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

export const sendValidationError = (res, errors, message = 'Validation Error') => {
  return res.status(400).json({
    success: false,
    message,
    errors,
  });
};

export const sendPaginated = (res, data, total, page = 1, limit = 10, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
};

export const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res, message = 'Deleted successfully') => {
  return res.status(204).json({ success: true, message });
};

export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({ success: false, message });
};

export const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({ success: false, message });
};

export const sendNotFound = (res, message = 'Not found') => {
  return res.status(404).json({ success: false, message });
};

export const sendConflict = (res, message = 'Conflict') => {
  return res.status(409).json({ success: false, message });
};

export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendPaginated,
  sendCreated,
  sendNoContent,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendConflict,
};