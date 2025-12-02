import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@utils/apiError.js';
import { sendError } from '@utils/response.js';
import logger from '@utils/logger.js';
import { config } from '@config/index.js';

export const errorMiddleware = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // log error
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // if it's an ApiError, use its status code and message
  if (error instanceof ApiError) {
    return sendError(res, error.message, error.statusCode);
  }

  // handle mongoose validation errors
  if (error.name === 'ValidationError') {
    return sendError(res, 'Validation error', 400, error.message);
  }

  // handle mongoose duplicate key errors
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    return sendError(res, 'Duplicate key error', 409);
  }

  // handle jwt errors
  if (error.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // default to 500 server error
  return sendError(
    res,
    config.nodeEnv === 'production' ? 'Internal server error' : error.message,
    500,
    config.nodeEnv === 'development' ? error.stack : undefined
  );
};

