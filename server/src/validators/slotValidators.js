import Joi from 'joi';
import { validateRequest } from './validation.js';

const querySchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
      ) {
        return helpers.error('date.invalid');
      }
      return value;
    })
    .messages({
      'date.invalid': 'date must be a valid calendar date',
    })
    .required(),
}).unknown(false);

export const validateSlotQuery = validateRequest(querySchema, 'query');
