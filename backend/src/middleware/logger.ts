import type { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
};

export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`Error: ${error.message} - ${new Date().toISOString()}`);
  next(error); // Pass the error to the next error handling middleware
};
