export function isCurrentScheduleFormat(schedule) {
  return Array.isArray(schedule?.workingDays)
    && schedule.workingDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    && Array.isArray(schedule.sessions)
    && Number.isInteger(schedule.slotDuration)
    && Array.isArray(schedule.breaks)
    && typeof schedule.isActive === 'boolean';
}
