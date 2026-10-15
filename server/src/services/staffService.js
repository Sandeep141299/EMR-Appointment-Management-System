import bcrypt from 'bcrypt';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { getAuditActorDetails } from '../utils/auditActorDetails.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { escapeRegex } from '../utils/escapeRegex.js';

function toUserProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  };
}

function throwIfDuplicate(error) {
  if (error.code === 11000) {
    throw new AppError('A user with this email already exists', 409);
  }
  throw error;
}

async function createStaffUser({ name, email, password, department }, role) {
  let user;
  try {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role,
      department: department || null,
    });
  } catch (error) {
    throwIfDuplicate(error);
  }

  return user;
}

export async function createDoctor(input) {
  const user = await createStaffUser(input, 'DOCTOR');
  try {
    const doctor = await Doctor.create({
      userId: user._id,
      department: input.department,
    });
    return {
      id: doctor._id.toString(),
      department: doctor.department,
      user: toUserProfile(user),
    };
  } catch (error) {
    await cleanupDoctorUser(user);
    if (error.code === 11000) {
      throw new AppError('A doctor profile already exists for this user', 409);
    }
    throw error;
  }
}

async function cleanupDoctorUser(user) {
  try {
    await User.deleteOne({ _id: user._id });
  } catch (error) {
    console.error('Failed to clean up doctor user after profile creation failed:', error);
  }
}

export async function createReceptionist(input) {
  const user = await createStaffUser(input, 'RECEPTIONIST');
  return toUserProfile(user);
}

export async function listDoctors(department) {
  const filter = department
    ? { department: new RegExp(`^${escapeRegex(department)}$`, 'i') }
    : {};
  const doctors = await Doctor.find(filter)
    .sort({ department: 1, _id: 1 })
    .populate({
      path: 'userId',
      match: { role: 'DOCTOR', isActive: true },
      select: 'name',
    });

  return doctors
    .filter((doctor) => doctor.userId)
    .map((doctor) => ({
      id: doctor._id.toString(),
      name: doctor.userId.name,
      department: doctor.department,
    }));
}

export async function listStaffUsers(role) {
  const users = await User.find({ role })
    .select('name email role department isActive')
    .sort({ nameNormalized: 1, _id: 1 })
    .lean();
  const doctorProfiles = role === 'DOCTOR'
    ? await Doctor.find({ userId: { $in: users.map(({ _id }) => _id) } })
      .select('userId department')
      .lean()
    : [];
  const departmentsByUserId = new Map(
    doctorProfiles.map((doctor) => [doctor.userId.toString(), doctor.department]),
  );

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: role === 'DOCTOR'
      ? departmentsByUserId.get(user._id.toString()) || ''
      : user.department || '',
    isActive: user.isActive,
  }));
}

export async function updateStaffUser(userId, input, actor, requestDetails) {
  const user = await User.findById(userId).select('name email role department isActive');
  if (!user || !['DOCTOR', 'RECEPTIONIST'].includes(user.role)) {
    throw new AppError('Staff user not found', 404);
  }
  const update = { ...input };
  validateStaffUpdate(user, update);
  normalizeStaffUpdate(update);
  await saveStaffUpdate(user, update);
  await syncDoctorDepartment(user, update);
  await auditStaffUpdate(user, update, actor, requestDetails);
  return { ...toUserProfile(user), isActive: user.isActive };
}

function validateStaffUpdate(user, update) {
  if (user.role === 'DOCTOR' && Object.hasOwn(update, 'department') && !update.department) {
    throw new AppError('Doctor department is required', 400);
  }
}

function normalizeStaffUpdate(update) {
  if (Object.hasOwn(update, 'email')) update.email = update.email.toLowerCase();
}

async function saveStaffUpdate(user, update) {
  try {
    for (const [field, value] of Object.entries(update)) {
      user[field] = field === 'department' && value === '' ? null : value;
    }
    await user.save();
  } catch (error) {
    throwIfDuplicate(error);
  }
}

async function syncDoctorDepartment(user, update) {
  if (user.role === 'DOCTOR' && Object.hasOwn(update, 'department')) {
    const doctor = await Doctor.findOneAndUpdate(
      { userId: user._id },
      { $set: { department: update.department } },
      { new: true, runValidators: true },
    );
    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }
  }
}

async function auditStaffUpdate(user, update, actor, requestDetails) {
  await logAuditEvent({
    action: 'STAFF_UPDATE',
    ...getAuditActorDetails(actor, requestDetails),
    targetType: 'User',
    targetId: user._id,
    metadata: { role: user.role, fields: Object.keys(update) },
  });
}
