import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { fetchRainfallData } from '../services/weatherService';
import { fetchFloodNews } from '../services/newsService';

export const handleChat = async (req: Request, res: Response) => {
  const { message, language, history, location } = req.body;
  
  const apiKey = process.env.GEMINI_API_KEY;

  // Log every incoming request for full traceability
  console.log("=== CHAT REQUEST RECEIVED ===");
  console.log("Message:", message);
  console.log("Language:", language);
  console.log("Location:", location);
  console.log("GEMINI_API_KEY present:", !!apiKey);
  console.log("GEMINI_API_KEY length:", apiKey ? apiKey.length : 0);
  console.log("GEMINI_API_KEY first 8 chars:", apiKey ? apiKey.substring(0, 8) : "MISSING");

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
    console.error("GEMINI_API_KEY is missing or not configured");
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
  }

  try {
    const weather = await fetchRainfallData(location || 'Mumbai');
    const news = await fetchFloodNews(`flood ${location || 'Mumbai'}`);
    console.log("Weather fetched:", JSON.stringify(weather));

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

    console.log("Calling Gemini model:", model);
    
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });
    const reply = result.text || "I'm sorry, I couldn't process that request.";
    
    console.log("Gemini responded successfully. Reply length:", reply.length);
    res.json({ response: reply });

  } catch (error: any) {
    // Log the FULL raw error - no hiding behind mock responses
    console.error("=== GEMINI ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    // Return the real error to the client so we can see it in the mobile app
    res.status(500).json({ 
      error: error.message || "Failed to process chat request",
      geminiStatus: error.status || null,
      details: error.errorDetails || null
    });
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
        systemInstruction: "You are a flood risk analyst. Return only valid JSON.",
      }
    });
    const result = await chat.sendMessage({ message: prompt });

    res.json(JSON.parse(result.text || "{}"));
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze risk" });
  }
};
