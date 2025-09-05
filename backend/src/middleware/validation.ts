import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export const validateRequest = <T extends ZodObject<any>>(schema: {
  body?: T;
  query?: T;
  params?: T;
}) => {
  return async (req: Request, res: Response, next: NextFunction):Promise<any> => {
    try {
      if (schema.body) {
        (req as any).validatedBody = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        (req as any).validatedQuery = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        (req as any).validatedParams = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};