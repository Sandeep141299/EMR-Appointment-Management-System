import { useAuth } from '../context/AuthContext.jsx';
import { canRole } from '../config/roleConfig.js';

export function useRole() {
  const { role } = useAuth();
  return {
    role,
    hasRole: (...allowedRoles) => allowedRoles.includes(role),
    can: (permission) => canRole(role, permission),
  };
}
