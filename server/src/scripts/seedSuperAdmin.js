import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import User from '../models/User.js';

const name = process.env.SEED_ADMIN_NAME?.trim();
const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD;

if (!name || !email || !password) {
  throw new Error('SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD are required');
}
if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
  throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters and at most 72 UTF-8 bytes');
}

try {
  await mongoose.connect(env.mongoUri);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.role !== 'SUPER_ADMIN') {
      throw new Error('The seed email already belongs to a non-admin user');
    }
    console.log('Super Admin already exists; no changes made.');
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      name,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    });
    console.log('Super Admin created successfully.');
  }
} catch (error) {
  console.error('Failed to seed Super Admin:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
