import 'dotenv/config';

function getPositiveInteger(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined || value === '') return defaultValue;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function getSecret(name) {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be at least 32 characters`);
  }
  return value;
}

function getTokenLifetime(name, defaultValue) {
  const value = process.env[name] || defaultValue;
  if (!/^[1-9]\d*[smhd]$/.test(value)) {
    throw new Error(`${name} must be a duration such as 15m or 7d`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) {
  throw new Error('NODE_ENV must be development, test, or production');
}

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI is required');
}

const accessTokenSecret = getSecret('ACCESS_TOKEN_SECRET');
const refreshTokenSecret = getSecret('REFRESH_TOKEN_SECRET');
if (accessTokenSecret === refreshTokenSecret) {
  throw new Error('ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different');
}

const timeZone = process.env.TIME_ZONE || 'Asia/Kolkata';
try {
  new Intl.DateTimeFormat('en-US', { timeZone });
} catch {
  throw new Error('TIME_ZONE must be a valid IANA time zone');
}

export const env = Object.freeze({
  nodeEnv,
  port: getPositiveInteger('PORT', 5000),
  mongoUri,
  accessTokenSecret,
  refreshTokenSecret,
  timeZone,
  accessTokenExpiresIn: getTokenLifetime('ACCESS_TOKEN_EXPIRES_IN', '15m'),
  refreshTokenExpiresIn: getTokenLifetime('REFRESH_TOKEN_EXPIRES_IN', '7d'),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  rateLimitWindowMs: getPositiveInteger('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: getPositiveInteger('RATE_LIMIT_MAX', 100),
});
