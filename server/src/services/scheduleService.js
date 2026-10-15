import Doctor from '../models/Doctor.js';
import Schedule from '../models/Schedule.js';
import { AppError } from '../utils/AppError.js';
import { getAuditActorDetails } from '../utils/auditActorDetails.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { isCurrentScheduleFormat } from '../utils/scheduleFormat.js';

async function ensureDoctorExists(doctorId) {
  const doctorExists = await Doctor.exists({ _id: doctorId });
  if (!doctorExists) {
    throw new AppError('Doctor not found', 404);
  }
}

function scheduleResponse(schedule) {
  if (!schedule) return null;
  return {
    doctorId: schedule.doctorId.toString(),
    workingDays: schedule.workingDays,
    sessions: schedule.sessions,
    slotDuration: schedule.slotDuration,
    breaks: schedule.breaks,
    isActive: schedule.isActive,
  };
}

async function saveSchedule(doctorId, update, options) {
  try {
    return await Schedule.findOneAndUpdate({ doctorId }, update, options);
  } catch (error) {
    if (error.code !== 11000) throw error;
    // Retry without upsert when a concurrent writer created this doctor's schedule.
    return Schedule.findOneAndUpdate(
      { doctorId },
      update,
      { ...options, upsert: false },
    );
  }
}

async function auditScheduleUpdate(doctorId, schedule, actor, requestDetails) {
  await logAuditEvent({
    action: 'DOCTOR_SCHEDULE_UPDATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'Schedule',
    targetId: schedule._id,
    metadata: { doctorId: doctorId.toString(), isActive: schedule.isActive },
  });
}

export async function setDoctorSchedule(doctorId, input, actor, requestDetails) {
  await ensureDoctorExists(doctorId);
  const update = { $set: input };
  const options = {
    new: true,
    upsert: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  };
  const schedule = await saveSchedule(doctorId, update, options);
  if (!schedule) {
    throw new AppError('Doctor schedule changed while saving; please retry', 409);
  }
  await auditScheduleUpdate(doctorId, schedule, actor, requestDetails);
  return scheduleResponse(schedule);
}

async function ensureScheduleReadAccess(doctorId, actor) {
  if (actor.role !== 'DOCTOR') return;
  const profile = await Doctor.findOne({ userId: actor._id }).select('_id').lean();
  if (!profile || profile._id.toString() !== doctorId.toString()) {
    throw new AppError('You may only view your own schedule', 403);
  }
}

export async function getDoctorSchedule(doctorId, actor) {
  await ensureDoctorExists(doctorId);
  await ensureScheduleReadAccess(doctorId, actor);
  const schedule = await Schedule.findOne({ doctorId }).select(
    'doctorId workingDays sessions slotDuration breaks isActive',
  ).lean();
  if (schedule && !isCurrentScheduleFormat(schedule)) {
    return {
      doctorId: schedule.doctorId.toString(),
      requiresReconfiguration: true,
    };
  }
  return scheduleResponse(schedule);
}
