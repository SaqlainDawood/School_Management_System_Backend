import mongoose from 'mongoose';

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('❌ Error:', err);

  // Mongoose CastError - Invalid ObjectId
  if (err instanceof mongoose.Error.CastError) {
    error.message = `Resource not found with id of ${err.value}`;
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error.message = `Duplicate field value entered for ${field}`;
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.message = messages.join(', ');
    error.statusCode = 400;
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Multer Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 400;
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error.message = 'Too many files';
    error.statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected file field';
    error.statusCode = 400;
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export default { errorHandler, notFound };