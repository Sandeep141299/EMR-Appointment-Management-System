export const adminAppointmentsRoom = 'appointments:admins';

export function doctorDateRoom(doctorId, date) {
  return `appointments:doctor:${doctorId}:date:${date}`;
}
