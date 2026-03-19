import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  village: { type: String, required: true },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Alert', alertSchema);
