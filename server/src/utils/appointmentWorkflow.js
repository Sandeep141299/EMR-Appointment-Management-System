const allowedTransitions = {
  SCHEDULED: ['ARRIVED', 'CANCELLED'],
  ARRIVED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionAppointment(fromStatus, toStatus) {
  return allowedTransitions[fromStatus]?.includes(toStatus) === true;
}

export function getAppointmentActiveState(status) {
  return ['SCHEDULED', 'ARRIVED'].includes(status);
}
