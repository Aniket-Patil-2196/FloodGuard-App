import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  
  if (!uri) {
    console.error('ERROR: MONGO_URI is not defined in your environment variables.');
    console.error('Please ensure you have a MONGO_URI set correctly in App Settings.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.db?.databaseName || 'floodDB'}`);
    console.log(`Host: ${conn.connection.host}`);
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`Database Connection Error: ${errorMessage}`);
    
    if (errorMessage.includes('bad auth') || errorMessage.includes('authentication failed')) {
      console.error('TIP: Your MongoDB credentials (username or password) appear to be incorrect.');
      console.error('Please check the MONGO_URI in your App Settings and ensure special characters in the password are URL encoded.');
    } else if (uri.includes('<password>')) {
      console.error('TIP: Your MONGO_URI still contains the "<password>" placeholder. Please replace it with your actual database password.');
    }
    
    console.error('Server will continue to run, but database-dependent features will fail.');
  }
};

export default connectDB;
