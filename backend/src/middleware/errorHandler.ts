import { config } from '@/config';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export const errorHandler = (
  error: AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: error.flatten 
    });
  }

  // Operational errors
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(config.nodeEnv === 'development' && {
      stack: error.stack,
    }),
  });
};