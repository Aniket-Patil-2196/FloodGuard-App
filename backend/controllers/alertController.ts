// @ts-nocheck
import { Request, Response } from 'express';
import Alert from '../models/Alert';
import User from '../models/User';
import { sendSMS } from '../services/smsService';
import { sendEmail } from '../services/emailService';
import { broadcastPushAlert } from '../services/alertService';

export const sendAlert = async (req: Request, res: Response) => {
  const { village, riskLevel, message, broadcastToAll } = req.body;
  const severity = riskLevel || 'MEDIUM';

  try {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    const alert = await Alert.create({ 
      title: broadcastToAll ? 'General Alert' : `Alert for ${village}`,
      village: broadcastToAll ? 'All Villages' : village, 
      severity: severity, 
      source: 'ADMIN',
      message: message,
      expiresAt: expiry
    });

    // Find users: either in affected village or all users
    const query = broadcastToAll ? {} : { village };
    const users = await User.find(query);
    
    let notifiedCount = 0;
    for (const user of users) {
      const langMsg = {
        English: `FLOOD ALERT (${severity}): ${message}`,
        Marathi: `पूर इशारा (${severity}): ${message}`,
        Hindi: `बाढ़ की चेतावनी (${severity}): ${message}`
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
          await sendEmail(user.email, `FloodGuard Emergency Alert: ${severity}`, langMsg);
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

export const broadcastAlert = async (req: Request, res: Response) => {
  const { title, message, severity, radius, center, village } = req.body;
  const adminId = (req as any).user?._id;

  try {
    const alert = await broadcastPushAlert({
      title,
      message,
      severity,
      source: 'ADMIN',
      radius,
      center,
      village,
      adminId
    });

    res.status(201).json({ message: 'Push alerts broadcasted successfully', alert });
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
    const alerts = await Alert.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getActiveAlerts = async (req: Request, res: Response) => {
  try {
    const activeAlerts = await Alert.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json(activeAlerts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
};

export const getAlertStats = async (req: Request, res: Response) => {
  try {
    // Analytics: Total users with push enabled vs disabled
    const User = require('../models/User').default;
    const totalUsers = await User.countDocuments({});
    const pushEnabledUsers = await User.countDocuments({ notificationsEnabled: true, expoPushToken: { $exists: true, $ne: null } });

    // Analytics: Alerts sent by severity
    const alertsBySeverity = await Alert.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Analytics: Alerts by source
    const alertsBySource = await Alert.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    const activeAlertsCount = await Alert.countDocuments({ status: 'ACTIVE' });

    res.json({
      users: { total: totalUsers, pushEnabled: pushEnabledUsers },
      severityStats: alertsBySeverity,
      sourceStats: alertsBySource,
      activeAlertsCount
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};
