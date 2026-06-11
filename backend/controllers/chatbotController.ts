import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { fetchRainfallData } from '../services/weatherService';
import { fetchFloodNews } from '../services/newsService';

export const handleChat = async (req: Request, res: Response) => {
  const { message, language, history, location } = req.body;
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const weather = await fetchRainfallData(location || 'Mumbai');
    const news = await fetchFloodNews(`flood ${location || 'Mumbai'}`);

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
      console.warn("GEMINI_API_KEY is missing. Returning mock AI response.");
      return res.json({ 
        response: `**[MOCK AI RESPONSE]**\nHello! I am your AI assistant. I received your message: "${message}".\n\n*Current Weather in ${weather.city || 'your area'}:*\n- Rainfall: ${weather.rainfall}mm\n- Temperature: ${weather.temperature}°C\n- Humidity: ${weather.humidity}%\n\n*Please ensure your GEMINI_API_KEY is configured on the backend for real responses.*` 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-2.0-flash";

    const context = `
      Current Weather in ${weather.city || 'Mumbai'}:
      - Rainfall: ${weather.rainfall}mm
      - Temperature: ${weather.temperature}°C
      - Humidity: ${weather.humidity}%
      
      Recent News:
      ${news.map((n: any) => `- ${n.title}: ${n.description}`).join('\n')}
    `;

    const systemInstruction = `
      You are FloodGuard AI, a highly intelligent, empathetic, and professional emergency assistant.
      Your goal is to provide accurate, detailed, and real-time flood-related information, safety guidance, and predictions.
      
      CORE RULES:
      1. CRITICAL: You MUST respond entirely in the user's requested language. The requested language is: ${language || 'English'}. Do NOT mix languages. Do NOT respond in English unless requested.
      2. FORMATTING: You MUST use Markdown formatting for all your responses.
         - Use headings (##, ###) for sections.
         - Use bullet points (*) or numbered lists (1., 2.) for steps.
         - Use **bold** text to emphasize risk levels and critical alerts.
      3. If the user is in an emergency, prioritize immediate safety instructions (e.g., "Move to higher ground", "Disconnect power").
      4. Use the provided real-time context (weather and news) to give specific insights.
      5. Maintain a professional yet helpful tone.
      6. For risk analysis, use these levels: **LOW**, **MODERATE**, **HIGH**, **CRITICAL**. Explain WHY.
      
      CONTEXT:
      ${context}
    `;

    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });
    const reply = result.text || "I'm sorry, I couldn't process that request.";
    
    res.json({ response: reply });
  } catch (error: any) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat request" });
  }
};

export const analyzeRisk = async (req: Request, res: Response) => {
  const { location, rainfall, riverLevel } = req.body;
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key missing");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Analyze flood risk for ${location || 'this area'} with:
      - Rainfall: ${rainfall}mm
      - River Level: ${riverLevel}m
      
      Return a JSON object with:
      {
        "riskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
        "score": 0-100,
        "reason": "Detailed explanation",
        "recommendations": ["Action 1", "Action 2"]
      }
    `;

    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      config: {
        systemInstruction: "You are a flood risk analyst.",
      }
    });
    const result = await chat.sendMessage({ message: prompt });

    res.json(JSON.parse(result.text || "{}"));
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze risk" });
  }
};
