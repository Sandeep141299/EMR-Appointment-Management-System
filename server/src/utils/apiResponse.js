export function sendResponse(res, {
  success = true,
  statusCode = 200,
  message,
  data = null,
  meta = null,
}) {
  return res.status(statusCode).json({
    success,
    message,
    data,
    meta,
  });
}
