import mongoose from 'mongoose';

const patientCounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  sequence: {
    type: Number,
    required: true,
    default: 0,
  },
});

const PatientCounter = mongoose.model('PatientCounter', patientCounterSchema);

export default PatientCounter;
