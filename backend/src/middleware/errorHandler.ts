import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.status || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : err.message;

  // In production, we should not return the stack trace or detailed error message for 500s
  // For now, we sanitize the message.
  
  res.status(statusCode).json({
    error: message,
  });
};
