import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory: validate request body/query/params against a Zod schema.
 * Usage: validate(mySchema, 'body')
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      (req as any)[source] = parsed; // Replace with parsed (sanitized) data
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        const formattedErrors = (error.issues || []).map((issue: any) => ({
          field: issue.path?.join('.') || '',
          message: issue.message || 'Validation error',
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formattedErrors,
        });
        return;
      }

      next(error);
    }
  };
};
