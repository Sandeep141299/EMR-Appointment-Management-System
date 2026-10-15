function minutes(time) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return Number.NaN;
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

function validatePeriods(periods, field, label, errors) {
  let latestEnd = Number.NEGATIVE_INFINITY;
  const ordered = periods
    .map((period, index) => ({ period, index }))
    .sort((left, right) => minutes(left.period.startTime) - minutes(right.period.startTime));

  ordered.forEach(({ period, index }) => {
    const start = minutes(period.startTime);
    const end = minutes(period.endTime);
    if (Number.isNaN(start)) {
      errors[`${field}.${index}.startTime`] = 'Enter a valid 24-hour time';
    }
    if (Number.isNaN(end)) {
      errors[`${field}.${index}.endTime`] = 'Enter a valid 24-hour time';
    }
    if (start >= end) {
      errors[`${field}.${index}.endTime`] = `${label} end must be later than its start`;
    }
    if (start < latestEnd) {
      errors[`${field}.${index}.startTime`] = `${label}s must not overlap`;
    }
    latestEnd = Math.max(latestEnd, end);
  });
}

export function validateSchedule(schedule) {
  const errors = {};
  if (!schedule.workingDays.length) {
    errors.workingDays = 'Select at least one working day';
  }
  if (!Number.isInteger(schedule.slotDuration) || schedule.slotDuration <= 0) {
    errors.slotDuration = 'Slot duration must be a positive number';
  }
  schedule.sessions.forEach((session, index) => {
    if (!session.name.trim()) errors[`sessions.${index}.name`] = 'Session name is required';
  });
  schedule.breaks.forEach((breakPeriod, index) => {
    if (!breakPeriod.name.trim()) errors[`breaks.${index}.name`] = 'Break name is required';
  });
  validatePeriods(schedule.sessions, 'sessions', 'Session', errors);
  validatePeriods(schedule.breaks, 'breaks', 'Break', errors);
  return errors;
}
