import { AppError } from '../utils/AppError.js';

export function validateRequest(schema, property) {
  if (!schema) {
    throw new Error('A request validation schema is required');
  }

  return function validate(req, res, next) {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      const issues = error.details.flatMap(({ message, path, context }) => {
        if (context?.issues) {
          return context.issues;
        }
        return [{
          field: path.join('.'),
          message,
        }];
      });
      return next(new AppError('Request validation failed', 400, issues));
    }

    req[property] = value;
    return next();
  };
}
