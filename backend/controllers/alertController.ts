import { Request, Response } from 'express';
import Alert from '../models/Alert';
import User from '../models/User';
import { sendSMS } from '../services/smsService';
import { sendEmail } from '../services/emailService';

export const sendAlert = async (req: Request, res: Response) => {
  const { village, riskLevel, message, broadcastToAll } = req.body;

  try {
    const alert = await Alert.create({ 
      village: broadcastToAll ? 'All Villages' : village, 
      riskLevel, 
      message 
    });

    // Find users: either in affected village or all users
    const query = broadcastToAll ? {} : { village };
    const users = await User.find(query);
    
    let notifiedCount = 0;
    for (const user of users) {
      const langMsg = {
        English: `FLOOD ALERT (${riskLevel}): ${message}`,
        Marathi: `पूर इशारा (${riskLevel}): ${message}`,
        Hindi: `बाढ़ की चेतावनी (${riskLevel}): ${message}`
      }[user.language as 'English' | 'Marathi' | 'Hindi'] || message;

      // Send SMS
      try {
        if (user.phone) {
          await sendSMS(user.phone, langMsg);
        }
      } catch (err) {
        console.error(`Failed SMS to ${user.phone}: ${(err as Error).message}`);
      }

      // Send Email (if user has email)
      try {
        if (user.email) {
          await sendEmail(user.email, `FloodGuard Emergency Alert: ${riskLevel}`, langMsg);
        }
      } catch (err) {
        console.error(`Failed Email to ${user.email}`);
      }

      notifiedCount++;
    }

    res.status(201).json({ alert, notifiedCount });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const testSMS = async (req: any, res: Response) => {
  const { phone } = req.body;
  try {
    await sendSMS(phone, "Test message from FloodGuard Admin Panel. Twilio is working!");
    res.json({ message: 'Test SMS sent successfully' });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await Alert.find({}).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
