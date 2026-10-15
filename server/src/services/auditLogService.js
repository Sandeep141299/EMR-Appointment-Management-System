import AuditLog from '../models/AuditLog.js';

async function findAuditLogPage(page, pageSize) {
  return AuditLog.find({})
      .select('action outcome actorId role email targetType targetId createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate({ path: 'actorId', select: 'name', options: { lean: true } })
      .lean();
}

function toAuditLogResponse(log) {
  return {
    id: log._id.toString(),
    action: log.action,
    outcome: log.outcome,
    actor: { name: log.actorId?.name || null, email: log.email || null },
    role: log.role,
    targetType: log.targetType,
    targetId: log.targetId?.toString() || null,
    createdAt: log.createdAt,
  };
}

function getAuditLogMeta(page, pageSize, total) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export async function listAuditLogs({ page, pageSize }) {
  const [logs, total] = await Promise.all([
    findAuditLogPage(page, pageSize),
    AuditLog.countDocuments({}),
  ]);
  return {
    data: logs.map(toAuditLogResponse),
    meta: getAuditLogMeta(page, pageSize, total),
  };
}
