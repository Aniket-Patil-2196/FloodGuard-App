import mongoose from 'mongoose';

const floodPredictionSchema = new mongoose.Schema({
  village: { type: String, required: true },
  rainfall: { type: Number, required: true },
  riverLevel: { type: Number, required: true },
  soilMoisture: { type: Number, required: true },
  floodProbability: { type: Number, required: true },
  riskLevel: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('FloodPrediction', floodPredictionSchema);
