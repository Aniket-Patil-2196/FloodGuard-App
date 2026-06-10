import axios from 'axios';

export const sendPushNotification = async (expoPushToken: string, title: string, body: string) => {
  if (!expoPushToken) return;

  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    priority: 'high',
  };

  try {
    await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    console.log(`Push notification sent to ${expoPushToken}`);
  } catch (error) {
    console.error(`Failed to send push notification to ${expoPushToken}`, error);
  }
};
