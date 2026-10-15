import { validatedTimeToMinutes } from './time.js';

export function validateSchedule(schedule) {
  return [
    ...validatePeriods(schedule.sessions || [], 'sessions', 'Session'),
    ...validatePeriods(schedule.breaks || [], 'breaks', 'Break'),
  ];
}

function validatePeriods(periods, field, label) {
  const issues = [];
  const ordered = periods
    .map((period, index) => ({ period, index }))
    .sort((a, b) => validatedTimeToMinutes(a.period.startTime) - validatedTimeToMinutes(b.period.startTime));
  let latestPeriodEnd = Number.NEGATIVE_INFINITY;
  for (const { period, index } of ordered) {
    const start = validatedTimeToMinutes(period.startTime);
    const end = validatedTimeToMinutes(period.endTime);
    if (start >= end) {
      issues.push({
        field: `${field}.${index}.endTime`,
        message: `${label} end must be later than its start`,
      });
    }
    if (start < latestPeriodEnd) {
      issues.push({ field: `${field}.${index}.startTime`, message: `${label}s must not overlap` });
    }
    latestPeriodEnd = Math.max(latestPeriodEnd, end);
  }
  return issues;
}
