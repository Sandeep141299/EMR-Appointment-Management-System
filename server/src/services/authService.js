import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { getAuditActorDetails } from '../utils/auditActorDetails.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { hashToken } from '../utils/tokenHash.js';

const bcryptRounds = 12;
const dummyPasswordHash = bcrypt.hash('invalid-login-user', bcryptRounds);

function getUserProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}

function createTokenPair(userId) {
  return {
    accessToken: jwt.sign({ sub: userId, jti: randomUUID(), type: 'access' }, env.accessTokenSecret, {
      algorithm: 'HS256',
      expiresIn: env.accessTokenExpiresIn,
    }),
    refreshToken: jwt.sign({ sub: userId, jti: randomUUID(), type: 'refresh' }, env.refreshTokenSecret, {
      algorithm: 'HS256',
      expiresIn: env.refreshTokenExpiresIn,
    }),
  };
}

function getRefreshTokenSubject(token) {
  try {
    const payload = jwt.verify(token, env.refreshTokenSecret, {
      algorithms: ['HS256'],
    });
    if (
      typeof payload === 'string'
      || payload.type !== 'refresh'
      || typeof payload.sub !== 'string'
      || !mongoose.isValidObjectId(payload.sub)
    ) {
      throw new Error('Invalid refresh token claims');
    }
    return payload.sub;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

async function findLoginUser(email) {
  return User.findOne({ email: email.toLowerCase() })
    .select('+passwordHash +refreshTokenHash');
}

async function passwordMatchesUser(user, password) {
  const passwordHash = user?.passwordHash || await dummyPasswordHash;
  return bcrypt.compare(password, passwordHash);
}

async function auditFailedLogin(user, email, requestDetails) {
  await logAuditEvent({
    action: 'AUTH_LOGIN',
    outcome: 'FAILURE',
    ...getAuditActorDetails(user, requestDetails),
    email,
    targetType: 'User',
    targetId: user?._id || null,
  });
}

async function recordLogin(user, tokens, requestDetails) {
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, isActive: true },
    { $set: { refreshTokenHash: hashToken(tokens.refreshToken) } },
    { new: true },
  );
  if (!updatedUser) throw new AppError('Invalid email or password', 401);
  await logAuditEvent({
    action: 'AUTH_LOGIN',
    outcome: 'SUCCESS',
    ...getAuditActorDetails(updatedUser, requestDetails),
    email: updatedUser.email,
    targetType: 'User',
    targetId: updatedUser._id,
  });
  return updatedUser;
}

export async function login({ email, password }, requestDetails) {
  const normalizedEmail = email.toLowerCase();
  const user = await findLoginUser(normalizedEmail);
  const passwordMatches = await passwordMatchesUser(user, password);
  if (!user || !user.isActive || !passwordMatches) {
    await auditFailedLogin(user, normalizedEmail, requestDetails);
    throw new AppError('Invalid email or password', 401);
  }
  const tokens = createTokenPair(user._id.toString());
  const updatedUser = await recordLogin(user, tokens, requestDetails);
  return {
    user: getUserProfile(updatedUser),
    ...tokens,
  };
}

export async function refresh(refreshToken) {
  const userId = getRefreshTokenSubject(refreshToken);
  const tokens = createTokenPair(userId);
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      isActive: true,
      refreshTokenHash: hashToken(refreshToken),
    },
    { $set: { refreshTokenHash: hashToken(tokens.refreshToken) } },
    { new: true },
  );

  if (!user) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  return {
    user: getUserProfile(user),
    ...tokens,
  };
}

export async function logout(refreshToken) {
  await User.updateOne(
    { refreshTokenHash: hashToken(refreshToken) },
    { $set: { refreshTokenHash: null } },
  );
}
