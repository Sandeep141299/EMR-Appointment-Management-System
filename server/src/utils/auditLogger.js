import AuditLog from '../models/AuditLog.js';

export function logAuditEvent(event) {
  return AuditLog.create({
    action: event.action,
    outcome: event.outcome,
    actorId: event.actorId || null,
    role: event.role || null,
    email: event.email || null,
    ipAddress: event.ipAddress || null,
    userAgent: event.userAgent?.slice(0, 500) || null,
    targetType: event.targetType || null,
    targetId: event.targetId || null,
    metadata: event.metadata || {},
  });
}
