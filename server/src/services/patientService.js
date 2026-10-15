import Patient from '../models/Patient.js';
import { AppError } from '../utils/AppError.js';
import { getAuditActorDetails } from '../utils/auditActorDetails.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { escapeRegex } from '../utils/escapeRegex.js';

function toPatientResponse(patient) {
  return {
    id: patient._id.toString(),
    patientId: patient.patientId,
    name: patient.name,
    mobile: patient.mobile,
    email: patient.email,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    address: patient.address,
    emergencyContact: patient.emergencyContact || {
      name: '',
      mobile: '',
      relationship: '',
    },
    createdAt: patient.createdAt,
  };
}

export async function createPatient(input) {
  return Patient.create(input);
}

export async function registerPatient(input, actor, requestDetails) {
  const patient = await createPatient({
    ...input,
    dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00.000Z`) : null,
  });

  await logAuditEvent({
    action: 'PATIENT_CREATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'Patient',
    targetId: patient._id,
    metadata: {},
  });

  return toPatientResponse(patient);
}

export async function updatePatient(patientId, input, actor, requestDetails) {
  const patient = await Patient.findById(patientId);
  if (!patient) throw new AppError('Patient not found', 404);
  const update = { ...input };
  normalizePatientUpdate(update);
  await savePatientUpdate(patient, update);
  await auditPatientUpdate(patient, update, actor, requestDetails);
  return toPatientResponse(patient);
}

function normalizePatientUpdate(update) {
  if (!Object.hasOwn(update, 'dateOfBirth')) return;
  update.dateOfBirth = update.dateOfBirth
    ? new Date(`${update.dateOfBirth}T00:00:00.000Z`)
    : null;
}

async function savePatientUpdate(patient, update) {
  for (const [field, value] of Object.entries(update)) patient[field] = value;
  await patient.save();
}

async function auditPatientUpdate(patient, update, actor, requestDetails) {
  await logAuditEvent({
    action: 'PATIENT_UPDATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'Patient',
    targetId: patient._id,
    metadata: { fields: Object.keys(update) },
  });
}

export async function findPatientByPatientId(patientId) {
  const patient = await Patient.findOne({ patientId: patientId.toUpperCase() });
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }
  return patient;
}

function buildPatientListFilter(options) {
  const filter = {};
  if (!options.search) return filter;
  const escaped = escapeRegex(options.search);
  const prefix = new RegExp(`^${escaped}`, 'i');
  filter.$or = [
    { patientId: prefix },
    { mobile: new RegExp(`^${escaped}`) },
    { nameNormalized: new RegExp(`^${escaped.toLocaleLowerCase('en')}`) },
  ];
  return filter;
}

async function queryPatientList(filter, options, page, pageSize) {
  const sortDirection = options.sortOrder === 'desc' ? -1 : 1;
  return Promise.all([
    Patient.find(filter)
      .select('patientId name mobile email dateOfBirth gender address emergencyContact createdAt')
      .sort({ [options.sortBy || 'name']: sortDirection, _id: sortDirection })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Patient.countDocuments(filter),
  ]);
}

function patientListMeta(page, pageSize, total) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && total > 0,
  };
}

export async function listPatients(options) {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const filter = buildPatientListFilter(options);
  const [patients, total] = await queryPatientList(filter, options, page, pageSize);
  return {
    items: patients.map(toPatientResponse),
    meta: patientListMeta(page, pageSize, total),
  };
}
