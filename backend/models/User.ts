import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  village: { type: String, required: true },
  city: { type: String, required: true },
  language: { type: String, enum: ['English', 'Marathi', 'Hindi'], default: 'English' },
  familyMembers: { type: Number, default: 0 },
  animals: { type: Number, default: 0 },
  latitude: { type: Number },
  longitude: { type: Number },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.models.User || mongoose.model('User', userSchema);
