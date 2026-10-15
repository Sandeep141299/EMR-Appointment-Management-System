import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';

function getAccessToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const authorization = socket.handshake.headers?.authorization;
  if (typeof authorization !== 'string') return null;
  const [scheme, token, extra] = authorization.split(' ');
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
    return payload;
  } catch {
    return null;
  }
}

async function findAuthenticatedUser(payload) {
  return User.findOne({ _id: payload.sub, isActive: true })
    .select('_id name email role department')
    .lean();
}

async function findSocketDoctorId(user) {
  if (user.role !== 'DOCTOR') return null;
  const doctor = await Doctor.findOne({ userId: user._id }).select('_id').lean();
  return doctor?._id.toString() || null;
}

export async function authenticateSocket(socket, next) {
  const token = getAccessToken(socket);
  if (!token) return next(new AppError('Authentication required', 401));
  const payload = verifyAccessToken(token);
  if (!payload) return next(new AppError('Invalid or expired access token', 401));
  try {
    return await attachSocketUser(socket, payload, next);
  } catch (error) {
    console.error('Socket authentication failed:', error.name, error.code);
    return next(new AppError('Authentication service unavailable', 503));
  }
}

async function attachSocketUser(socket, payload, next) {
  const user = await findAuthenticatedUser(payload);
  if (!user) return next(new AppError('Invalid or expired access token', 401));
  const doctorId = await findSocketDoctorId(user);
  if (user.role === 'DOCTOR' && !doctorId) {
    return next(new AppError('Doctor profile not found', 401));
  }
  socket.data.user = { id: user._id.toString(), role: user.role, doctorId };
  return next();
}
