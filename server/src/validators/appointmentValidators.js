import Joi from 'joi';
import { validateRequest } from './validation.js';

const objectId = Joi.string().hex().length(24);
const calendarDate = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .custom((value, helpers) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
      ? value
      : helpers.error('date.invalid');
  })
  .messages({ 'date.invalid': 'date must be a valid calendar date' });

const mobile = Joi.string()
  .trim()
  .pattern(/^\+?[0-9][0-9\s()-]{5,19}$/)
  .max(20);

const listQuery = Joi.object({
  doctorId: objectId,
  doctorName: Joi.string().trim().min(1).max(120),
  department: Joi.string().trim().min(1).max(120),
  patientId: Joi.string().trim().min(1).max(40),
  patientName: Joi.string().trim().min(1).max(120),
  mobile,
  status: Joi.string().valid('SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED'),
  date: calendarDate,
  dateFrom: calendarDate,
  dateTo: calendarDate,
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('date', 'slotStart', 'createdAt', 'status').default('date'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
}).unknown(false).custom((filters, helpers) => {
  if (filters.date && (filters.dateFrom || filters.dateTo)) {
    return helpers.error('date.conflict');
  }
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
    return helpers.error('date.range');
  }
  return filters;
}).messages({
  'date.conflict': 'Use date or a date range, not both',
  'date.range': 'dateFrom must be on or before dateTo',
});

const newPatient = Joi.object({
  name: Joi.string().trim().min(1).max(120).required(),
  mobile: mobile.required(),
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim(),
  dateOfBirth: calendarDate,
  gender: Joi.string().valid(
    'FEMALE',
    'MALE',
    'NON_BINARY',
    'OTHER',
    'PREFER_NOT_TO_SAY',
  ),
  address: Joi.string().trim().max(500),
  emergencyContact: Joi.object({
    name: Joi.string().trim().max(120),
    mobile,
    relationship: Joi.string().trim().max(60),
  }).unknown(false),
}).unknown(false);

const patientListQuery = Joi.object({
  search: Joi.string().trim().min(1).max(120),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('name', 'patientId', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
}).unknown(false);

const patientUpdate = Joi.object({
  name: Joi.string().trim().min(1).max(120),
  mobile,
  email: Joi.string().email({ tlds: { allow: false } }).max(254).lowercase().trim().allow('', null),
  dateOfBirth: calendarDate.allow(null),
  gender: Joi.string().valid(
    'FEMALE',
    'MALE',
    'NON_BINARY',
    'OTHER',
    'PREFER_NOT_TO_SAY',
  ),
  address: Joi.string().trim().max(500).allow(''),
  emergencyContact: Joi.object({
    name: Joi.string().trim().max(120).allow(''),
    mobile: mobile.allow(''),
    relationship: Joi.string().trim().max(60).allow(''),
  }).unknown(false),
}).min(1).unknown(false);

const appointmentBody = Joi.object({
  patientId: Joi.string().trim().min(1).max(40),
  patient: newPatient,
  doctorId: objectId.required(),
  date: calendarDate.required(),
  slotStart: Joi.string().pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/).required(),
  purpose: Joi.string().trim().max(500).allow('').default(''),
  notes: Joi.string().trim().max(5000).allow('').default(''),
})
  .xor('patientId', 'patient')
  .unknown(false);

const schemas = {
  create: appointmentBody,
  patientCreate: newPatient,
  patientUpdate,
  update: Joi.object({
    purpose: Joi.string().trim().max(500).allow(''),
    notes: Joi.string().trim().max(5000).allow(''),
  }).min(1).unknown(false),
  params: Joi.object({
    appointmentId: objectId.required(),
  }).unknown(false),
  listQuery,
  patientListQuery,
};

export const validateAppointmentBody = (schemaName) => (
  validateRequest(schemas[schemaName], 'body')
);
export const validateAppointmentParams = validateRequest(schemas.params, 'params');
export const validatePatientParams = validateRequest(
  Joi.object({ patientId: objectId.required() }).unknown(false),
  'params',
);
export const validateAppointmentQuery = (schemaName) => (
  validateRequest(schemas[schemaName], 'query')
);
