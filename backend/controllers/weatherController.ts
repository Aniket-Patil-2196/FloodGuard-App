import { Request, Response } from 'express';
import Weather from '../models/Weather';
import { fetchRainfallData } from '../services/weatherService';
import { fetchFloodNews } from '../services/newsService';

export const getWeatherData = async (req: Request, res: Response) => {
  const { city } = req.params;
  try {
    console.log(`Getting weather data for ${city}`);
    const weatherData = await fetchRainfallData(city);
    
    // Wrap in data property as requested by frontend
    res.json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error(`Error in getWeatherData for ${city}:`, error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch weather data",
      error: (error as Error).message 
    });
  }
};

export const getNews = async (req: Request, res: Response) => {
  const { city } = req.query;
  try {
    const cityName = (city as string) || 'Sangli';
    console.log(`Getting news for city: ${cityName}`);
    const news = await fetchFloodNews(cityName);
    
    res.json({ 
      success: true, 
      news: news,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in getNews:", error);
    res.status(500).json({ success: false, message: "Failed to fetch news data" });
  }
};

export const getWeatherHistory = async (req: Request, res: Response) => {
  try {
    const history = await Weather.find({}).sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};
