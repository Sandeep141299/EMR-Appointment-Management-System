import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  // Store a calendar date as UTC midnight; slotStart is local clinic HH:mm.
  date: {
    type: Date,
    required: true,
  },
  slotStart: {
    type: String,
    required: true,
    match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
  },
  purpose: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: '',
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

appointmentSchema.pre('validate', function setActiveFromStatus() {
  this.isActive = ['SCHEDULED', 'ARRIVED'].includes(this.status);
});

appointmentSchema.index(
  { doctorId: 1, date: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  },
);
appointmentSchema.index({ doctorId: 1, date: 1, status: 1, slotStart: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ department: 1, date: 1, status: 1 });
appointmentSchema.index({ status: 1, date: 1, slotStart: 1 });
appointmentSchema.index({ date: 1, slotStart: 1 });
appointmentSchema.index({ createdAt: -1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
