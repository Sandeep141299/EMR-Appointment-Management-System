export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validatedTimeToMinutes(time) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time || '')) {
    return Number.NaN;
  }
  return timeToMinutes(time);
}
