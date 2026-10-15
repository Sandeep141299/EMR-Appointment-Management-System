import Joi from 'joi';
import { passwordSchema } from './common.js';
import { validateRequest } from './validation.js';

const schemas = {
  login: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).max(254).required(),
    password: passwordSchema.required(),
  }).unknown(false),
  refresh: Joi.object({
    refreshToken: Joi.string().min(1).required(),
  }).unknown(false),
  logout: Joi.object({
    refreshToken: Joi.string().min(1).required(),
  }).unknown(false),
};

export function validateBody(schemaName) {
  const schema = schemas[schemaName];
  return validateRequest(schema, 'body');
}
