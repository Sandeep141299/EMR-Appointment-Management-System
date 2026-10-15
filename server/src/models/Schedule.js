import mongoose from 'mongoose';
import { validateSchedule } from '../utils/scheduleValidation.js';

const scheduleTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  startTime: { type: String, required: true, match: scheduleTimePattern },
  endTime: { type: String, required: true, match: scheduleTimePattern },
}, { _id: false });

const breakSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  startTime: { type: String, required: true, match: scheduleTimePattern },
  endTime: { type: String, required: true, match: scheduleTimePattern },
}, { _id: false });

const scheduleSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    unique: true,
  },
  workingDays: {
    type: [Number],
    required: true,
    validate: [
      {
        validator: (days) => days.length > 0
          && days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
          && new Set(days).size === days.length,
        message: 'Working days must be unique integers from 0 (Sunday) to 6 (Saturday)',
      },
    ],
  },
  sessions: {
    type: [sessionSchema],
    required: true,
    validate: {
      validator: (sessions) => sessions.length > 0,
      message: 'A schedule must include at least one session',
    },
  },
  slotDuration: {
    type: Number,
    required: true,
    min: 1,
    max: 1440,
    validate: {
      validator: Number.isInteger,
      message: 'Slot duration must be a positive integer',
    },
  },
  breaks: { type: [breakSchema], default: [] },
  isActive: { type: Boolean, default: true, required: true },
}, { timestamps: true });

scheduleSchema.path('sessions').validate(function validateSessionIntervals(sessions) {
  return validateSchedule({ sessions, breaks: this.breaks }).length === 0;
}, 'Schedule sessions and breaks must be valid and non-overlapping');

scheduleSchema.path('breaks').validate(function validateBreakIntervals(breaks) {
  return validateSchedule({ sessions: this.sessions, breaks }).length === 0;
}, 'Schedule sessions and breaks must be valid and non-overlapping');

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
