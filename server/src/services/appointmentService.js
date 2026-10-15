import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import { AppError } from '../utils/AppError.js';
import { getAppointmentActiveState, canTransitionAppointment } from '../utils/appointmentWorkflow.js';
import { getAuditActorDetails } from '../utils/auditActorDetails.js';
import { parseCalendarDate } from '../utils/calendarDate.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { emitAppointmentEvent } from '../socket/socketServer.js';
import * as patientService from './patientService.js';
import { getDoctorSlots } from './slotService.js';

export async function buildAppointmentScope(user) {
  if (user.role !== 'DOCTOR') return {};

  const doctor = await Doctor.findOne({ userId: user._id }).select('_id').lean();
  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }
  return { doctorId: doctor._id };
}

function toPatientResponse(patient) {
  if (!patient) return null;
  const hasPatientDetails = Boolean(patient?.patientId && patient?.name);
  if (!hasPatientDetails) return { id: patient.toString() };
  return {
    id: patient._id.toString(),
    patientId: patient.patientId,
    name: patient.name,
    mobile: patient.mobile,
  };
}

function toAppointmentResponse(appointment) {
  const doctor = appointment.doctorId;
  const doctorId = doctor?._id || doctor;

  return {
    id: appointment._id.toString(),
    patient: toPatientResponse(appointment.patientId),
    doctorId: doctorId.toString(),
    department: appointment.department,
    date: appointment.date.toISOString().slice(0, 10),
    slotStart: appointment.slotStart,
    purpose: appointment.purpose,
    notes: appointment.notes,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
  };
}

function isDuplicateBooking(error) {
  return error?.code === 11000
    && (error.keyPattern?.doctorId || error.keyValue?.doctorId);
}

async function findPatient(input) {
  if (input.patient) {
    return patientService.createPatient({
      ...input.patient,
      dateOfBirth: input.patient.dateOfBirth
        ? parseCalendarDate(input.patient.dateOfBirth)
        : null,
    });
  }

  return patientService.findPatientByPatientId(input.patientId);
}

export async function createAppointment(input, actor, requestDetails) {
  ensureCanBook(actor);
  const doctor = await findActiveDoctor(input.doctorId);
  await ensureSlotAvailable(input);
  const patient = await findPatient(input);
  const appointment = await createAppointmentRecord(input, patient, doctor);
  await logAuditEvent({
    action: 'APPOINTMENT_CREATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'Appointment',
    targetId: appointment._id,
    metadata: { doctorId: doctor._id.toString(), status: appointment.status },
  });
  emitAppointmentEvent('appointment:created', appointment);

  await appointment.populate('patientId', 'patientId name mobile');
  return toAppointmentResponse(appointment);
}

function ensureCanBook(actor) {
  if (!['SUPER_ADMIN', 'RECEPTIONIST'].includes(actor.role)) {
    throw new AppError('You do not have permission to create appointments', 403);
  }
}

async function findActiveDoctor(doctorId) {
  const doctor = await Doctor.findById(doctorId).populate({
    path: 'userId',
    match: { role: 'DOCTOR', isActive: true },
    select: '_id',
  });
  if (!doctor?.userId) throw new AppError('Doctor not found', 404);
  return doctor;
}

async function ensureSlotAvailable({ doctorId, date, slotStart }) {
  const slots = await getDoctorSlots(doctorId, date);
  const available = slots.some((slot) => (
    slot.slotStart === slotStart && slot.status === 'available'
  ));
  if (!available) {
    throw new AppError('The selected appointment slot is not available', 409);
  }
}

async function createAppointmentRecord(input, patient, doctor) {
  try {
    return await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      department: doctor.department,
      date: parseCalendarDate(input.date),
      slotStart: input.slotStart,
      purpose: input.purpose,
      notes: input.notes,
      status: 'SCHEDULED',
      isActive: true,
    });
  } catch (error) {
    await cleanupNewPatient(input, patient);
    // The partial unique index is authoritative when concurrent requests race.
    if (isDuplicateBooking(error)) {
      throw new AppError('The selected appointment slot is already booked', 409);
    }
    throw error;
  }
}

async function cleanupNewPatient(input, patient) {
  if (!input.patient) return;
  try {
    await Patient.deleteOne({ _id: patient._id });
  } catch (error) {
    console.error('Failed to clean up patient after appointment creation failed:', error);
  }
}

function getAppointmentOptions(filters) {
  return { page: 1, pageSize: 20, sortBy: 'date', sortOrder: 'asc', ...filters };
}

function buildPatientFilter(options) {
  const filter = {};
  if (options.patientId) {
    filter.patientId = new RegExp(`^${escapeRegex(options.patientId)}$`, 'i');
  }
  if (options.patientName) {
    filter.nameNormalized = new RegExp(
      `^${escapeRegex(options.patientName.toLocaleLowerCase('en'))}`,
    );
  }
  if (options.mobile) filter.mobile = new RegExp(`^${escapeRegex(options.mobile)}`);
  return filter;
}

async function findPatientIds(options) {
  const filter = buildPatientFilter(options);
  return Object.keys(filter).length ? Patient.find(filter).distinct('_id') : null;
}

async function findDoctorNameIds(options) {
  if (!options.doctorName) return null;
  const matchingDoctors = await Doctor.find({
      department: options.department
        ? new RegExp(`^${escapeRegex(options.department)}$`, 'i')
        : { $exists: true },
    }).populate({
      path: 'userId',
      match: {
        nameNormalized: new RegExp(
          `^${escapeRegex(options.doctorName.toLocaleLowerCase('en'))}`,
        ),
        role: 'DOCTOR',
        isActive: true,
      },
      select: '_id',
  }).select('_id userId').lean();
  return matchingDoctors.filter((doctor) => doctor.userId).map((doctor) => doctor._id);
}

function intersectDoctorFilters(options, doctorNameIds) {
  const filters = [options.doctorId ? [options.doctorId] : null, doctorNameIds].filter(Boolean);
  if (filters.length === 0) return null;
  // Intersect explicit doctor and doctor-name filters rather than overriding either.
  return filters.slice(1).reduce(
    (matches, ids) => matches.filter((id) => ids.some((candidate) => String(candidate) === id)),
    filters[0].map(String),
  );
}

function buildAppointmentQuery(options, scope, patientIds, doctorIds) {
  const query = {
    ...(doctorIds ? { doctorId: { $in: doctorIds } } : {}),
    ...(patientIds ? { patientId: { $in: patientIds } } : {}),
    ...(options.department
      ? { department: new RegExp(`^${escapeRegex(options.department)}$`, 'i') }
      : {}),
    ...(options.status ? { status: options.status } : {}),
    ...getDateFilter(options),
    ...scope,
  };
  return query;
}

function buildAppointmentSort(options) {
  const direction = options.sortOrder === 'desc' ? -1 : 1;
  return options.sortBy === 'date'
    ? { date: direction, slotStart: direction, _id: direction }
    : { [options.sortBy]: direction, _id: direction };
}

async function queryAppointments(query, options) {
  const page = options.page;
  const pageSize = options.pageSize;
  const projection = 'patientId doctorId department date slotStart purpose notes status createdAt updatedAt';

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .select(projection)
      .sort(buildAppointmentSort(options))
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({ path: 'patientId', select: 'patientId name mobile' })
      .lean(),
    Appointment.countDocuments(query),
  ]);

  return {
    items: appointments.map(toAppointmentResponse),
    meta: getPaginationMeta(page, pageSize, total),
  };
}

export async function listAppointments(filters, actor) {
  const options = getAppointmentOptions(filters);
  const scope = await buildAppointmentScope(actor);
  const patientIds = await findPatientIds(options);
  if (patientIds?.length === 0) return emptyAppointmentPage(options);
  const doctorNameIds = await findDoctorNameIds(options);
  if (doctorNameIds?.length === 0) return emptyAppointmentPage(options);
  const doctorIds = actor.role === 'DOCTOR' ? null : intersectDoctorFilters(options, doctorNameIds);
  if (doctorIds?.length === 0) return emptyAppointmentPage(options);
  return queryAppointments(buildAppointmentQuery(options, scope, patientIds, doctorIds), options);
}

function getDateFilter(filters) {
  if (filters.date) {
    const date = parseCalendarDate(filters.date);
    return { date };
  }

  const date = {};
  if (filters.dateFrom) date.$gte = parseCalendarDate(filters.dateFrom);
  if (filters.dateTo) date.$lte = parseCalendarDate(filters.dateTo);
  return Object.keys(date).length ? { date } : {};
}

function getPaginationMeta(page, pageSize, total) {
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

function emptyAppointmentPage(filters) {
  return {
    items: [],
    meta: getPaginationMeta(filters.page, filters.pageSize, 0),
  };
}

async function findScopedAppointment(appointmentId, actor, scope = null) {
  const appointmentScope = scope || await buildAppointmentScope(actor);
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    ...appointmentScope,
  }).populate('patientId', 'patientId name mobile');

  if (!appointment) {
    if (
      actor.role === 'DOCTOR'
      && await Appointment.exists({ _id: appointmentId })
    ) {
      throw new AppError('You do not have permission to access this appointment', 403);
    }
    throw new AppError('Appointment not found', 404);
  }
  return appointment;
}

export async function getAppointment(appointmentId, actor) {
  const scope = await buildAppointmentScope(actor);
  return toAppointmentResponse(await findScopedAppointment(appointmentId, actor, scope));
}

export async function updateAppointment(appointmentId, updates, actor, requestDetails) {
  validateAppointmentUpdate(updates, actor);
  const scope = await buildAppointmentScope(actor);
  const appointment = await findScopedAppointment(appointmentId, actor, scope);
  if (!getAppointmentActiveState(appointment.status)) {
    throw new AppError('A completed or cancelled appointment cannot be edited', 409);
  }
  const updated = await persistAppointmentUpdate(appointment, updates, scope);
  await auditAppointmentUpdate(updated, updates, actor, requestDetails);
  return toAppointmentResponse(updated);
}

function validateAppointmentUpdate(updates, actor) {
  if (actor.role === 'DOCTOR' && (Object.keys(updates).length !== 1 || !Object.hasOwn(updates, 'notes'))) {
    throw new AppError('Doctors may update consultation notes only', 403);
  }
  if (!['SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(actor.role)) {
    throw new AppError('You do not have permission to update appointments', 403);
  }
}

async function persistAppointmentUpdate(appointment, updates, scope) {
  const updated = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: { $in: ['SCHEDULED', 'ARRIVED'] },
      ...scope,
    },
    { $set: updates },
    { new: true, runValidators: true },
  ).populate('patientId', 'patientId name mobile');
  if (!updated) throw new AppError('Appointment can no longer be edited', 409);
  return updated;
}

async function auditAppointmentUpdate(appointment, updates, actor, requestDetails) {
  await logAuditEvent({
    action: 'APPOINTMENT_UPDATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'Appointment',
    targetId: appointment._id,
    metadata: { updatedFields: Object.keys(updates) },
  });
  emitAppointmentEvent('appointment:updated', appointment);
}

export async function transitionAppointment(
  appointmentId,
  nextStatus,
  actor,
  requestDetails,
  scope = null,
) {
  validateTransitionPermission(nextStatus, actor);
  const appointmentScope = scope || await buildAppointmentScope(actor);
  const appointment = await findScopedAppointment(appointmentId, actor, appointmentScope);
  const previousStatus = appointment.status;
  if (!canTransitionAppointment(previousStatus, nextStatus)) {
    throw new AppError(`Cannot transition appointment from ${previousStatus} to ${nextStatus}`, 409);
  }
  const updated = await persistAppointmentTransition(
    appointment,
    previousStatus,
    nextStatus,
    appointmentScope,
  );
  await auditAppointmentTransition(updated, previousStatus, nextStatus, actor, requestDetails);
  return toAppointmentResponse(updated);
}

function validateTransitionPermission(nextStatus, actor) {
  const staffTransition = ['ARRIVED', 'CANCELLED'].includes(nextStatus);
  if (staffTransition && !['SUPER_ADMIN', 'RECEPTIONIST'].includes(actor.role)) {
    throw new AppError('You do not have permission to change this appointment status', 403);
  }
  if (nextStatus === 'COMPLETED' && actor.role !== 'SUPER_ADMIN') {
    throw new AppError('You do not have permission to change this appointment status', 403);
  }
}

async function persistAppointmentTransition(appointment, previousStatus, nextStatus, scope) {
  const updated = await Appointment.findOneAndUpdate(
    {
      _id: appointment._id,
      status: previousStatus,
      ...scope,
    },
    {
      $set: {
        status: nextStatus,
        isActive: getAppointmentActiveState(nextStatus),
      },
    },
    { new: true, runValidators: true },
  ).populate('patientId', 'patientId name mobile');
  if (!updated) throw new AppError('Appointment status changed; reload and try again', 409);
  return updated;
}

async function auditAppointmentTransition(appointment, previousStatus, nextStatus, actor, requestDetails) {
  await logAuditEvent({
    action: nextStatus === 'CANCELLED' ? 'APPOINTMENT_CANCEL' : 'APPOINTMENT_STATUS_UPDATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'Appointment',
    targetId: appointment._id,
    metadata: { previousStatus, status: nextStatus },
  });
  emitAppointmentEvent(
    nextStatus === 'CANCELLED' ? 'appointment:cancelled' : 'appointment:updated',
    appointment,
  );
}

export async function markAppointmentArrived(appointmentId, actor, requestDetails) {
  const scope = await buildAppointmentScope(actor);
  return transitionAppointment(appointmentId, 'ARRIVED', actor, requestDetails, scope);
}

export async function cancelAppointment(appointmentId, actor, requestDetails) {
  const scope = await buildAppointmentScope(actor);
  return transitionAppointment(appointmentId, 'CANCELLED', actor, requestDetails, scope);
}

export async function completeAppointment(appointmentId, actor, requestDetails) {
  const scope = await buildAppointmentScope(actor);
  return transitionAppointment(appointmentId, 'COMPLETED', actor, requestDetails, scope);
}
