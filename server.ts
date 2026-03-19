import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";

import { createServer as createViteServer } from "vite";
import cors from "cors";
import cron from "node-cron";
import axios from "axios";

import connectDB from "./backend/config/db";
import authRoutes from "./backend/routes/authRoutes";
import alertRoutes from "./backend/routes/alertRoutes";
import weatherRoutes from "./backend/routes/weatherRoutes";
import predictionRoutes from "./backend/routes/predictionRoutes";
import chatbotRoutes from "./backend/routes/chatbotRoutes";

import { fetchRainfallData } from "./backend/services/weatherService";
import { predictFlood } from "./backend/services/predictionService";

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
  const PORT = process.env.PORT || 5000;

  const corsOptions = {
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json());

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/predictions", predictionRoutes);
  app.use("/api/chat", chatbotRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "floodDB" });
  });

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
