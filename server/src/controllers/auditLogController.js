import * as auditLogService from '../services/auditLogService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await auditLogService.listAuditLogs(req.query);
  return sendResponse(res, {
    message: 'Audit logs retrieved',
    data: result.data,
    meta: result.meta,
  });
});
