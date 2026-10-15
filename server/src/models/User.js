import mongoose from 'mongoose';

const userRoles = ['SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  nameNormalized: {
    type: String,
    select: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'must be a valid email address'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    required: true,
    enum: userRoles,
  },
  department: {
    type: String,
    trim: true,
    maxlength: 120,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  refreshTokenHash: {
    type: String,
    default: null,
    select: false,
  },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      delete ret.passwordHash;
      delete ret.refreshTokenHash;
      delete ret.__v;
      return ret;
    },
  },
});

userSchema.index({ nameNormalized: 1, role: 1 });

userSchema.pre('validate', function normalizeName() {
  if (this.isModified('name')) {
    this.nameNormalized = this.name.trim().toLocaleLowerCase('en');
  }
});

const User = mongoose.model('User', userSchema);

export default User;
