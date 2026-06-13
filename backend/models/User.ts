// @ts-nocheck
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  password: string;
  village: string;
  language: 'English' | 'Marathi' | 'Hindi';
  familyMembers: number;
  animals: number;
  latitude?: number;
  longitude?: number;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  role: 'user' | 'admin';
  expoPushToken?: string;
  notificationsEnabled: boolean;
  city?: string;
  district?: string;
  state?: string;
  locationSource?: 'GPS' | 'MANUAL' | 'REGISTRATION';
  lastLocationUpdate?: Date;
  lastActive: Date;
  createdAt: Date;
  isModified(path: string): boolean;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  village: { type: String, required: true },
  language: { type: String, enum: ['English', 'Marathi', 'Hindi'], default: 'English' },
  familyMembers: { type: Number, default: 0 },
  animals: { type: Number, default: 0 },
  latitude: { type: Number },
  longitude: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [lng, lat]
  },
  city: { type: String },
  district: { type: String },
  state: { type: String },
  locationSource: { type: String, enum: ['GPS', 'MANUAL', 'REGISTRATION'] },
  lastLocationUpdate: { type: Date },
  expoPushToken: { type: String },
  notificationsEnabled: { type: Boolean, default: true },
  lastActive: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function(next) {
  if (this.isModified('latitude') || this.isModified('longitude')) {
    if (this.latitude && this.longitude) {
      this.location = {
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
      };
    }
  }

  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
