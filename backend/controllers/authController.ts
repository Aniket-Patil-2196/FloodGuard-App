import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { sendSMS } from '../services/smsService';

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, phone, password, village, city, language, familyMembers, animals, latitude, longitude, role } = req.body;

  try {
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map(p => p.trim());
    const assignedRole = adminPhones.includes(phone) ? 'admin' : (role || 'user');

    const user = await User.create({
      name, email, phone, password, village, city, language, familyMembers, animals, latitude, longitude, role: assignedRole
    });

    console.log('User created:', user._id);

    if (user) {
      // Send welcome SMS
      const welcomeMsg = {
        English: `Welcome ${name} to FloodGuard! You will receive alerts for ${village}, ${city}.`,
        Marathi: `पूररक्षक मध्ये आपले स्वागत आहे ${name}! आपल्याला ${village}, ${city} साठी सतर्कता प्राप्त होईल.`,
        Hindi: `फ्लडगार्ड में आपका स्वागत है ${name}! आपको ${village}, ${city} के लिए अलर्ट प्राप्त होंगे।`
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
        city: user.city,
        role: user.role,
        token: generateToken(user._id.toString())
      });
    }
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  try {
    const user: any = await User.findOne({ phone });
    if (user && (await bcrypt.compare(password, user.password))) {
      console.log('Login successful for:', phone);
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        city: user.city,
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

export const getUserProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
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
