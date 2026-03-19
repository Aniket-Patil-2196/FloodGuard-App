import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  
  if (!uri) {
    console.error('ERROR: MONGO_URI is not defined in your environment variables.');
    console.error('Please ensure you have a .env file with MONGO_URI set correctly.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.db?.databaseName || 'floodDB'}`);
    console.log(`Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
