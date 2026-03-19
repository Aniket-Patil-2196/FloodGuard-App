import axios from 'axios';
import dotenv from 'dotenv';
import Weather from '../models/Weather';

dotenv.config();

export const fetchRainfallData = async (city: string) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey || apiKey === "MY_WEATHER_API_KEY" || apiKey === "") {
      console.warn('Weather API key missing, using mock data');
      return {
        city,
        rainfall: Math.random() * 10,
        temperature: 25 + Math.random() * 5,
        humidity: 60 + Math.random() * 20,
        timestamp: new Date()
      };
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    console.log("Weather API full response:", JSON.stringify(data, null, 2));

    if (!data || !data.main) {
      throw new Error("Invalid weather data received from API");
    }

    // We still want to save to DB, but return full data for frontend
    const weatherData = {
      city: data.name,
      rainfall: data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      condition: data.weather?.[0]?.description || "Unknown",
      timestamp: new Date()
    };

    console.log("Parsed Weather Data:", weatherData);

    await Weather.create(weatherData);
    
    // Return full data merged with our calculated fields for compatibility
    return {
      success: true,
      ...data,
      rainfall: weatherData.rainfall,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      condition: weatherData.condition
    };
  } catch (error) {
    console.error(`Weather API error for ${city}: ${(error as Error).message}`);
    throw error;
  }
};
