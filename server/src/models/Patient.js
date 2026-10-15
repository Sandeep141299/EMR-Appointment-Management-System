import mongoose from 'mongoose';
import PatientCounter from './PatientCounter.js';

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true,
    immutable: true,
  },
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
  mobile: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20,
    match: /^\+?[0-9][0-9\s()-]{5,19}$/,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    maxlength: 254,
    default: null,
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY'],
    default: 'PREFER_NOT_TO_SAY',
  },
  address: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  emergencyContact: {
    name: { type: String, trim: true, maxlength: 120, default: '' },
    mobile: { type: String, trim: true, maxlength: 20, default: '' },
    relationship: { type: String, trim: true, maxlength: 60, default: '' },
  },
}, {
  timestamps: true,
});

patientSchema.index({ mobile: 1 });
patientSchema.index({ nameNormalized: 1 });
patientSchema.index({ nameNormalized: 1, mobile: 1 });
patientSchema.index({ patientId: 'text', mobile: 'text', name: 'text' });

patientSchema.pre('validate', function normalizeName() {
  if (this.isModified('name')) {
    this.nameNormalized = this.name.trim().toLocaleLowerCase('en');
  }
});

patientSchema.pre('validate', async function generatePatientId() {
  if (this.patientId) return;

  const year = new Date().getUTCFullYear();
  const counter = await PatientCounter.findOneAndUpdate(
    { _id: `patient-${year}` },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true },
  );
  this.patientId = `PT-${year}-${String(counter.sequence).padStart(6, '0')}`;
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
