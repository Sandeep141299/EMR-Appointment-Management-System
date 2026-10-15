import { useRole } from '../hooks/useRole.js';

export default function RoleGate({ roles = [], permission, children, fallback = null }) {
  const { hasRole, can } = useRole();
  const allowed = permission ? can(permission) : hasRole(...roles);
  return allowed ? children : fallback;
}
