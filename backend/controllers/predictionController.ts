import { Request, Response } from 'express';
import FloodPrediction from '../models/FloodPrediction';
import Alert from '../models/Alert';
import User from '../models/User';
import { sendSMS } from '../services/smsService';
import { predictFlood } from '../services/predictionService';

export const triggerPrediction = async (req: Request, res: Response) => {
  const { village, rainfall, river_level, elevation, soil_moisture, slope } = req.body;

  try {
    const predictionData = predictFlood(
      rainfall, 
      river_level, 
      elevation, 
      soil_moisture, 
      slope
    );

    const prediction = await FloodPrediction.create({
      village,
      rainfall,
      riverLevel: river_level,
      soilMoisture: soil_moisture,
      floodProbability: predictionData.flood_probability,
      riskLevel: predictionData.risk_level
    });

    // If risk is HIGH or CRITICAL, send SOS
    if (predictionData.risk_level === 'HIGH' || predictionData.risk_level === 'CRITICAL') {
      const message = `URGENT: Flood risk is ${predictionData.risk_level} in ${village}. Probability: ${(predictionData.flood_probability * 100).toFixed(1)}%. Please evacuate to nearest shelter.`;
      
      await Alert.create({ village, riskLevel: predictionData.risk_level, message });

      const users = await User.find({ village });
      for (const user of users) {
        try {
          await sendSMS(user.phone, message);
        } catch (err) {
          console.error(`SOS SMS failed for ${user.phone}`);
        }
      }
    }

    res.json(prediction);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const predictions = await FloodPrediction.find({}).sort({ timestamp: -1 });
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
