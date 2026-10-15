import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Schedule from '../models/Schedule.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { isCurrentScheduleFormat } from '../utils/scheduleFormat.js';
import { generateDoctorSlots } from '../utils/slotGenerator.js';

export async function getDoctorSlots(doctorId, date, now = new Date()) {
  await ensureDoctorExists(doctorId);
  const schedule = await findCurrentSchedule(doctorId);
  if (!schedule || !schedule.isActive) return [];
  const slotOptions = {
    workingDays: schedule.workingDays,
    sessions: schedule.sessions,
    slotDuration: schedule.slotDuration,
    breaks: schedule.breaks,
    date,
    now,
    timeZone: env.timeZone,
  };
  const generatedSlots = generateDoctorSlots(slotOptions);
  if (generatedSlots.length === 0) return generatedSlots;
  const bookedStarts = await findBookedSlotStarts(doctorId, date, generatedSlots);
  return generateDoctorSlots({ ...slotOptions, bookedSlotStarts: bookedStarts });
}

async function ensureDoctorExists(doctorId) {
  if (!await Doctor.exists({ _id: doctorId })) {
    throw new AppError('Doctor not found', 404);
  }
}

async function findCurrentSchedule(doctorId) {
  const schedule = await Schedule.findOne({ doctorId })
    .select('workingDays sessions slotDuration breaks isActive')
    .lean();
  if (!schedule) return null;
  if (!isCurrentScheduleFormat(schedule)) {
    throw new AppError('Doctor schedule must be reconfigured before slots can be generated', 409);
  }
  return schedule;
}

async function findBookedSlotStarts(doctorId, date, slots) {
  const calendarDate = new Date(`${date}T00:00:00.000Z`);
  const appointments = await Appointment.find({
    doctorId,
    date: calendarDate,
    isActive: true,
    slotStart: { $in: slots.map(({ slotStart }) => slotStart) },
  }).select('slotStart').lean();
  return appointments.map(({ slotStart }) => slotStart);
}
