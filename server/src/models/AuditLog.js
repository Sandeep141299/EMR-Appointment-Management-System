import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  outcome: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS',
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'],
    default: null,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    maxlength: 254,
    default: null,
  },
  ipAddress: {
    type: String,
    maxlength: 64,
    default: null,
  },
  userAgent: {
    type: String,
    maxlength: 500,
    default: null,
  },
  targetType: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({}),
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
