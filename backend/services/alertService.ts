import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import User from '../models/User';
import Alert, { IAlert } from '../models/Alert';
import { getIO } from '../utils/socket';

// Create a new Expo SDK client
let expo = new Expo();

interface BroadcastParams {
  title: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: 'ADMIN' | 'AI_SYSTEM';
  radius?: number; // km
  center?: { lat: number; lng: number };
  adminId?: string;
  village?: string;
}

export const broadcastPushAlert = async (params: BroadcastParams) => {
  try {
    // 1. Build Query for Users
    const query: any = { notificationsEnabled: true, expoPushToken: { $exists: true, $ne: null } };

    if (params.radius && params.center) {
      // Find users within radius using $geoWithin $centerSphere (radius in radians: km / 6378.1)
      query.location = {
        $geoWithin: {
          $centerSphere: [[params.center.lng, params.center.lat], params.radius / 6378.1]
        }
      };
    }

    const users = await User.find(query);
    const pushTokens = users.map(u => u.expoPushToken).filter(t => t && Expo.isExpoPushToken(t)) as string[];

    console.log(`Found ${pushTokens.length} users for alert broadcast.`);

    // 2. Save Alert to Database
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // Default 24 hr expiry

    const alertDoc = await Alert.create({
      title: params.title,
      message: params.message,
      severity: params.severity,
      source: params.source,
      radius: params.radius,
      village: params.village,
      location: params.center ? { type: 'Point', coordinates: [params.center.lng, params.center.lat] } : undefined,
      createdBy: params.adminId,
      expiresAt: expiry
    });

    // Broadcast to connected socket clients
    try {
      getIO().emit('new_alert', alertDoc);
    } catch (e) {
      console.log('Socket IO emit failed:', e);
    }

    if (pushTokens.length === 0) return alertDoc;

    // 3. Construct Messages
    let messages: ExpoPushMessage[] = [];
    const prefix = params.severity === 'CRITICAL' ? '🚨 CRITICAL ALERT: ' :
                   params.severity === 'HIGH' ? '⚠️ WARNING: ' :
                   params.severity === 'MEDIUM' ? '🌧️ WEATHER: ' : 'ℹ️ ADVISORY: ';

    for (let pushToken of pushTokens) {
      messages.push({
        to: pushToken,
        sound: 'default',
        title: prefix + params.title,
        body: params.message,
        data: { alertId: alertDoc._id, severity: params.severity, source: params.source },
      });
    }

    // 4. Chunk and Send
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];
    
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push chunk:', error);
      }
    }

    console.log('Push tickets created:', tickets.length);
    return alertDoc;

  } catch (error) {
    console.error('Broadcast failed:', error);
    throw error;
  }
};
