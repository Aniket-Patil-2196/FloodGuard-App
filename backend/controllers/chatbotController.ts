import { Request, Response } from 'express';
import { GoogleGenAI } from "@google/genai";
import { fetchRainfallData } from '../services/weatherService';
import { fetchFloodNews } from '../services/newsService';

export const handleChat = async (req: Request, res: Response) => {
  const { message, language, history, location } = req.body;
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Diagnostic logging
    console.log("=== CHAT REQUEST ===");
    console.log("Message:", message);
    console.log("Language:", language);
    console.log("API Key present:", !!apiKey);
    console.log("API Key:", apiKey ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : "MISSING");

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
      throw new Error("GEMINI_API_KEY is not configured on the server");
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-3-flash-preview"; // Restored to last known working model

    console.log("Selected Gemini model:", model);

    // Fetch real-time context
    const weather = await fetchRainfallData(location || 'Mumbai');
    const news = await fetchFloodNews(`flood ${location || 'Mumbai'}`);

    const context = `
      Current Weather in ${location || 'Mumbai'}:
      - Rainfall: ${weather.rainfall}mm
      - Temperature: ${weather.temperature}°C
      - Humidity: ${weather.humidity}%
      
      Recent News:
      ${news.map((n: any) => `- ${n.title}: ${n.description}`).join('\n')}
    `;

    console.log("Prompt context length:", context.length, "chars");

    const systemInstruction = `
      You are FloodGuard AI, a highly intelligent, empathetic, and professional emergency assistant.
      Your goal is to provide accurate, detailed, and real-time flood-related information, safety guidance, and predictions.
      
      CORE RULES:
      1. CRITICAL: You MUST respond entirely in the user's requested language: ${language || 'English'}. Do NOT mix languages.
      2. FORMATTING: Use Markdown - headings (##, ###), bullet points (*), **bold** for risk levels.
      3. GREETING HANDLING: If the user says hi/hello/hey or sends a casual greeting, respond with a SHORT friendly welcome (2-3 lines max). Do NOT dump the full weather report for greetings.
      4. CONTEXT USAGE: Only include weather/flood context when the user asks about floods, weather, risk, safety, or emergencies.
      5. VARIED RESPONSES: Each response must be directly relevant to what the user ACTUALLY asked. Do not repeat the same flood report for every message.
      6. For risk analysis, use levels: **LOW**, **MODERATE**, **HIGH**, **CRITICAL** with explanation.
      7. If the user is in an emergency, immediately provide safety instructions.
      
      AVAILABLE REAL-TIME CONTEXT (use only when relevant):
      ${context}
    `;

    const chat = ai.chats.create({
      model,
      config: { systemInstruction },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });
    const reply = result.text || "I'm sorry, I couldn't process that request.";
    
    console.log("Gemini SUCCESS. Reply length:", reply.length);
    res.json({ response: reply });

  } catch (error: any) {
    // Return raw error - NO mock responses
    console.error("=== GEMINI ERROR ===");
    console.error("Message:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
    res.status(500).json({ 
      error: error.message || "Failed to process chat request",
      geminiStatus: error.status || null,
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

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(result.text || "{}"));
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze risk" });
  }
};
