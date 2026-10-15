import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
}, {
  timestamps: true,
});

doctorSchema.index({ department: 1, _id: 1 });

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
