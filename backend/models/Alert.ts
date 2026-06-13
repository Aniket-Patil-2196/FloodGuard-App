import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'ADMIN' | 'AI_SYSTEM';
  district?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  radius?: number; // In kilometers
  status: 'ACTIVE' | 'EXPIRED';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

const alertSchema: Schema<IAlert> = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], required: true },
  source: { type: String, enum: ['ADMIN', 'AI_SYSTEM'], required: true },
  district: { type: String },
  village: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [lng, lat]
  },
  radius: { type: Number, default: 10 },
  status: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
});

alertSchema.index({ location: '2dsphere' });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired alerts

const Alert: Model<IAlert> = mongoose.models.Alert || mongoose.model<IAlert>('Alert', alertSchema);
export default Alert;
