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
  role: 'user' | 'admin';
  expoPushToken?: string;
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
  expoPushToken: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
