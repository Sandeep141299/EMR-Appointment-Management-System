import {
  CalendarDays,
  ClipboardList,
  Clock3,
  ContactRound,
  LayoutDashboard,
  UserCog,
  UsersRound,
} from 'lucide-react';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  RECEPTIONIST: 'RECEPTIONIST',
  DOCTOR: 'DOCTOR',
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'BOOK_APPOINTMENT',
    'VIEW_PATIENTS',
    'MANAGE_STAFF',
    'MANAGE_DOCTOR_SCHEDULES',
    'UPDATE_APPOINTMENT',
    'MARK_ARRIVED',
    'COMPLETE_APPOINTMENT',
    'CANCEL_APPOINTMENT',
  ],
  [ROLES.RECEPTIONIST]: [
    'BOOK_APPOINTMENT',
    'VIEW_PATIENTS',
    'UPDATE_APPOINTMENT',
    'MARK_ARRIVED',
    'CANCEL_APPOINTMENT',
  ],
  [ROLES.DOCTOR]: ['UPDATE_CONSULTATION_NOTES'],
};

export function canRole(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const NAV_ITEMS_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Staff', to: '/doctors', icon: UserCog },
    { label: 'Schedules', to: '/schedules', icon: Clock3 },
    { label: 'Scheduler', to: '/scheduler', icon: CalendarDays },
    { label: 'Appointments', to: '/appointments', icon: UsersRound },
    { label: 'Audit Logs', to: '/audit-logs', icon: ClipboardList },
  ],
  [ROLES.RECEPTIONIST]: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Scheduler', to: '/scheduler', icon: CalendarDays },
    { label: 'Book Appointment', to: '/book-appointment', icon: CalendarDays },
    { label: 'Appointments', to: '/appointments', icon: UsersRound },
    { label: 'Patients', to: '/patients', icon: ContactRound },
  ],
  [ROLES.DOCTOR]: [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'My Appointments', to: '/appointments', icon: UsersRound },
  ],
};
