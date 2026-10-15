export function getRequestDetails(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };
}
