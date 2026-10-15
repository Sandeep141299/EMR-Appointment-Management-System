import { timeToMinutes } from './time.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export function generateDoctorSlots({
  workingDays,
  sessions,
  slotDuration,
  breaks = [],
  date,
  now = new Date(),
  timeZone = 'Asia/Kolkata',
  bookedSlotStarts = [],
}) {
  if (!isUpcomingWorkingDay(date, workingDays, now, timeZone)) return [];
  const bookedStarts = new Set(bookedSlotStarts);
  const slots = [];
  for (const session of sessions) {
    slots.push(...generateSessionSlots(session, slotDuration, breaks, date, now, timeZone, bookedStarts));
  }
  return slots;
}

function isUpcomingWorkingDay(date, workingDays, now, timeZone) {
  const selectedDate = parseCalendarDate(date);
  const todayKey = formatDateKey(getZonedDateParts(now, timeZone));
  if (formatDateKey(selectedDate) < todayKey) return false;
  return workingDays.includes(new Date(`${date}T00:00:00.000Z`).getUTCDay());
}

function generateSessionSlots(session, duration, breaks, date, now, timeZone, bookedStarts) {
  const slots = [];
  const sessionStart = timeToMinutes(session.startTime);
  const sessionEnd = timeToMinutes(session.endTime);
  for (let start = sessionStart; start + duration <= sessionEnd; start += duration) {
    const slot = createSlot(start, duration, breaks, date, now, timeZone, bookedStarts);
    if (slot) slots.push(slot);
  }
  return slots;
}

function createSlot(start, duration, breaks, date, now, timeZone, bookedStarts) {
  const end = start + duration;
  if (overlapsBreak(start, end, breaks)) return null;
  const slotStart = minutesToTime(start);
  if (zonedTimeToDate(date, slotStart, timeZone) <= now) return null;
  return {
    slotStart,
    slotEnd: minutesToTime(end),
    status: bookedStarts.has(slotStart) ? 'booked' : 'available',
  };
}

function overlapsBreak(start, end, breaks) {
  return breaks.some((breakPeriod) => (
    start < timeToMinutes(breakPeriod.endTime)
    && end > timeToMinutes(breakPeriod.startTime)
  ));
}

function parseCalendarDate(date) {
  if (!datePattern.test(date || '')) {
    throw new RangeError('date must use YYYY-MM-DD format');
  }
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new RangeError('date must be a valid calendar date');
  }
  return { year, month, day };
}

function getZonedDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  );
}

function formatDateKey({ year, month, day }) {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function zonedTimeToDate(date, time, timeZone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let instant = targetAsUtc;

  // Recompute the timezone offset to handle daylight-saving transitions.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const zoned = getZonedDateParts(new Date(instant), timeZone);
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
    );
    const offset = zonedAsUtc - Math.floor(instant / 1000) * 1000;
    const correctedInstant = targetAsUtc - offset;
    if (correctedInstant === instant) break;
    instant = correctedInstant;
  }

  return new Date(instant);
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}
