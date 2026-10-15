import Joi from 'joi';
import { validateSchedule } from '../utils/scheduleValidation.js';
import { passwordSchema } from './common.js';
import { validateRequest } from './validation.js';

const createUserFields = {
  name: Joi.string().trim().min(1).max(120).required(),
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().required(),
  password: passwordSchema.required(),
};

const time = Joi.string().pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const schedulePeriod = Joi.object({
  name: Joi.string().trim().min(1).max(80).required(),
  startTime: time.required(),
  endTime: time.required(),
}).unknown(false);

const scheduleSchema = Joi.object({
  workingDays: Joi.array().items(Joi.number().integer().min(0).max(6)).min(1).unique().required(),
  sessions: Joi.array().items(schedulePeriod).min(1).required(),
  slotDuration: Joi.number().integer().positive().max(1440).required(),
  breaks: Joi.array().items(schedulePeriod).default([]),
  isActive: Joi.boolean().default(true),
}).unknown(false).custom((schedule, helpers) => {
  const issues = validateSchedule(schedule);
  if (issues.length > 0) {
    return helpers.error('schedule.invalid', { issues });
  }
  return schedule;
}).messages({
  'schedule.invalid': '{{#issues}}',
}).unknown(false);

const querySchemas = {
  doctors: Joi.object({
    department: Joi.string().trim().min(1).max(120),
  }).unknown(false),
  users: Joi.object({
    role: Joi.string().valid('DOCTOR', 'RECEPTIONIST').required(),
  }).unknown(false),
  auditLogs: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(25),
  }).unknown(false),
};

export const staffBodySchemas = {
  createDoctor: Joi.object({
    ...createUserFields,
    department: Joi.string().trim().min(1).max(120).required(),
  }).unknown(false),
  createReceptionist: Joi.object({
    ...createUserFields,
    department: Joi.string().trim().min(1).max(120),
  }).unknown(false),
  updateUser: Joi.object({
    name: Joi.string().trim().min(1).max(120),
    email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim(),
    department: Joi.string().trim().max(120).allow(''),
    isActive: Joi.boolean(),
  }).min(1).unknown(false),
  schedule: scheduleSchema,
};

export const validateStaffBody = (schemaName) => validateRequest(staffBodySchemas[schemaName], 'body');
export const validateStaffQuery = (schemaName) => validateRequest(querySchemas[schemaName], 'query');
export const validateStaffParams = (schema) => validateRequest(schema, 'params');
