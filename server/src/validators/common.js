import Joi from 'joi';

export const passwordSchema = Joi.string()
  .min(8)
  .max(72)
  .custom((value, helpers) => (
    Buffer.byteLength(value, 'utf8') > 72
      ? helpers.error('password.maxBytes')
      : value
  ))
  .messages({
    'password.maxBytes': 'password must not exceed 72 UTF-8 bytes',
  });
