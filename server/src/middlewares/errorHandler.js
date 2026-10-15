import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError('Route not found', 404));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode)
    && error.statusCode >= 400
    && error.statusCode < 600
    ? error.statusCode
    : 500;
  const isOperational = error.isOperational === true;
  const message = isOperational ? error.message : 'Internal server error';

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    meta: error.details ? { issues: error.details } : null,
  });
}
