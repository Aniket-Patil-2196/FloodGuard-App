import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

export const sendSMS = async (phone: string, message: string) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER?.replace(/\s+/g, '');

    if (!accountSid || !authToken || !fromPhone) {
      console.warn('Twilio credentials missing, skipping SMS');
      return null;
    }

    const client = twilio(accountSid, authToken);

    // Clean and convert to +91 format if not already
    let formattedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Remove leading zero if present
      formattedPhone = `+91${formattedPhone.replace(/^0+/, '')}`;
    }

    const response = await client.messages.create({
      body: message,
      from: fromPhone,
      to: formattedPhone
    });

    console.log(`SMS sent successfully to ${formattedPhone}: ${response.sid}`);
    return response;
  } catch (error) {
    console.error(`SMS failure to ${phone}: ${(error as Error).message}`);
    throw error;
  }
};
