// @ts-nocheck
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { sendSMS } from '../services/smsService';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, phone, password, village, language, familyMembers, animals, latitude, longitude, role } = req.body;
  let { email } = req.body;
  if (!email || email.trim() === '') {
    email = `${phone}@noemail.floodguard.com`;
  }

  try {
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map(p => p.trim());
    const assignedRole = adminPhones.includes(phone) ? 'admin' : (role || 'user');

    const user = await User.create({
      name, email, phone, password, village, language, familyMembers, animals, latitude, longitude, role: assignedRole
    });

    console.log('User created:', user._id);

    if (user) {
      // Send welcome SMS
      const welcomeMsg = {
        English: `Welcome ${name} to FloodGuard! You will receive alerts for ${village}.`,
        Marathi: `पूररक्षक मध्ये आपले स्वागत आहे ${name}! आपल्याला ${village} साठी सतर्कता प्राप्त होईल.`,
        Hindi: `फ्लडगार्ड में आपका स्वागत है ${name}! आपको ${village} के लिए अलर्ट प्राप्त होंगे।`
      }[user.language as 'English' | 'Marathi' | 'Hindi'] || `Welcome ${name} to FloodGuard!`;

      try {
        await sendSMS(phone, welcomeMsg);
      } catch (err) {
        console.error('Welcome SMS failed');
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id.toString())
      });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { phone, password, expoPushToken } = req.body;
  try {
    const user: any = await User.findOne({ phone });
    if (user && (await bcrypt.compare(password, user.password))) {
      
      // Update push token if provided
      if (expoPushToken && user.expoPushToken !== expoPushToken) {
        user.expoPushToken = expoPushToken;
        await user.save();
      }

      console.log('Login successful for:', phone);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        village: user.village,
        language: user.language,
        familyMembers: user.familyMembers,
        animals: user.animals,
        latitude: user.latitude,
        longitude: user.longitude,
        role: user.role,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(401).json({ message: 'Invalid phone or password' });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updatePushToken = async (req: Request, res: Response) => {
  const { expoPushToken } = req.body;
  const userId = (req as any).user?._id;

  if (!expoPushToken || !userId) {
    return res.status(400).json({ message: 'Token and User ID required' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.expoPushToken = expoPushToken;
    user.lastActive = new Date();
    await user.save();

    res.json({ message: 'Push token updated successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { notificationsEnabled } = req.body;
  const userId = (req as any).user?._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof notificationsEnabled === 'boolean') {
      user.notificationsEnabled = notificationsEnabled;
    }

    await user.save();
    
    // Send back updated user object to save in AsyncStorage
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      village: user.village,
      language: user.language,
      familyMembers: user.familyMembers,
      animals: user.animals,
      role: user.role,
      notificationsEnabled: user.notificationsEnabled,
      city: user.city,
      district: user.district,
      state: user.state,
      locationSource: user.locationSource,
      latitude: user.latitude,
      longitude: user.longitude,
      token: req.headers.authorization?.split(' ')[1] // return existing token
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  const { city, district, state, latitude, longitude, locationSource } = req.body;
  const userId = (req as any).user?._id;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (city !== undefined) user.city = city;
    if (district !== undefined) user.district = district;
    if (state !== undefined) user.state = state;
    if (latitude !== undefined) user.latitude = latitude;
    if (longitude !== undefined) user.longitude = longitude;
    if (locationSource !== undefined) user.locationSource = locationSource;
    
    user.lastLocationUpdate = new Date();

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      village: user.village,
      language: user.language,
      familyMembers: user.familyMembers,
      animals: user.animals,
      role: user.role,
      notificationsEnabled: user.notificationsEnabled,
      city: user.city,
      district: user.district,
      state: user.state,
      locationSource: user.locationSource,
      latitude: user.latitude,
      longitude: user.longitude,
      token: req.headers.authorization?.split(' ')[1]
    });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
