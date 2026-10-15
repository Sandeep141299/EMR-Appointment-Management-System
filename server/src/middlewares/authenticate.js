import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function getAccessToken(req) {
  const [scheme, token, extra] = req.get('authorization')?.split(' ') || [];
  return scheme?.toLowerCase() === 'bearer' && token && !extra ? token : null;
}

function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.accessTokenSecret, {
      algorithms: ['HS256'],
    });
    if (
      typeof payload === 'string'
      || payload.type !== 'access'
      || typeof payload.sub !== 'string'
      || !mongoose.isValidObjectId(payload.sub)
    ) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

async function findActiveUser(userId) {
  return User.findOne({ _id: userId, isActive: true })
    .select('_id name email role department');
}

export async function authenticate(req, res, next) {
  const token = getAccessToken(req);
  if (!token) return next(new AppError('Authentication required', 401));
  const userId = verifyAccessToken(token);
  if (!userId) return next(new AppError('Invalid or expired access token', 401));
  try {
    const user = await findActiveUser(userId);
    if (!user) return next(new AppError('Invalid or expired access token', 401));
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function authorize(...roles) {
  return function authorizeUser(req, res, next) {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to access this resource', 403));
    }
    return next();
  };
}
