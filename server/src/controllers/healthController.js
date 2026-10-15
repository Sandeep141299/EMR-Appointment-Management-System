import { sendResponse } from '../utils/apiResponse.js';
import { getHealth } from '../services/healthService.js';

export function getHealthStatus(req, res) {
  const health = getHealth();
  const isHealthy = health.status === 'ok';

  return sendResponse(res, {
    success: isHealthy,
    statusCode: isHealthy ? 200 : 503,
    message: isHealthy ? 'Service is healthy' : 'Service is unavailable',
    data: health,
  });
}
