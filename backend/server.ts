import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import cron from "node-cron";
import axios from "axios";

import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import alertRoutes from "./routes/alertRoutes";
import weatherRoutes from "./routes/weatherRoutes";
import predictionRoutes from "./routes/predictionRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";

import { fetchRainfallData } from "./services/weatherService";
import { predictFlood } from "./services/predictionService";

async function startServer() {
  // Validate critical environment variables
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter(env => !process.env[env]);
  
  if (missingEnv.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
    console.error('Please check your .env file.');
    process.exit(1);
  }

  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 3000;

  const corsOptions = {
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/predictions", predictionRoutes);
  app.use("/api/chat", chatbotRoutes);

  // Health Check Route
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Flood Prediction API is healthy",
      timestamp: new Date().toISOString()
    });
  });

  // Root Route
  app.get("/", (req, res) => {
    res.send("API is running successfully");
  });

  // Serve Static Frontend Files (Optional/Production)
  if (process.env.NODE_ENV === "production") {
    const frontendPath = path.join(__dirname, "../../frontend/dist");
    app.use(express.static(frontendPath));
    
    // Handle SPA routing - redirect all non-API requests to index.html
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(frontendPath, "index.html"));
      }
    });
  }

  // Auto Flood Prediction Every 10 Minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("Running scheduled flood prediction check...");
    try {
      const city = "Sangli"; // Default monitoring city
      const weather = await fetchRainfallData(city);
      
      const predictionData = predictFlood(
        weather.rainfall,
        5.0, // Mocked river level
        550,
        40,
        2
      );
      
      console.log("Scheduled prediction result:", predictionData);
    } catch (error) {
      console.error("Scheduled prediction failed:", (error as Error).message);
    }
  });

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
