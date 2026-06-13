import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import http from "http";
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
import mapRoutes from "./backend/routes/mapRoutes";

import { fetchRainfallData } from "./backend/services/weatherService";
import { predictFlood } from "./backend/services/predictionService";
import { broadcastPushAlert } from "./backend/services/alertService";
import { initSocket, getIO } from "./backend/utils/socket";

// Track the last AI alert time to prevent spam
let lastAiAlertTime: Date | null = null;
const AI_COOLDOWN_HOURS = 6;

async function startServer() {
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter(env => !process.env[env]);
  
  if (missingEnv.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
  }

  const app = express();
  const PORT = process.env.PORT || 5000;
  
  // Wrap express with HTTP server and initialize Socket.IO
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  const allowedOrigins = [
    "https://flood-guard-real-time-flood-predict.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ];

  app.use(cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.includes("vercel.app") || 
                        origin.includes("localhost") || 
                        origin.includes("run.app");
      if (isAllowed) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  }));

  app.options("*", cors());
  app.use(express.json());

  app.use("/api/auth", authRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/weather", weatherRoutes);
  app.use("/api/predictions", predictionRoutes);
  app.use("/api/chat", chatbotRoutes);
  app.use("/api/map", mapRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "floodDB" });
  });

  const startScheduledPredictions = () => {
    cron.schedule("*/10 * * * *", async () => {
      console.log("Running scheduled flood prediction check...");
      try {
        const city = "Sangli";
        const weather = await fetchRainfallData(city);
        
        const predictionData = await predictFlood(weather.rainfall, 5.0, 550, 40, 2);
        console.log("Scheduled prediction result:", predictionData);

        // Check if we need to auto-alert based on AI confidence
        if (predictionData.risk_level === 'HIGH' || predictionData.risk_level === 'CRITICAL' || predictionData.flood_probability >= 80) {
          const now = new Date();
          
          if (!lastAiAlertTime || (now.getTime() - lastAiAlertTime.getTime()) > (AI_COOLDOWN_HOURS * 60 * 60 * 1000)) {
            console.log("AI Confidence threshold crossed. Triggering Push Alert broadcast.");
            lastAiAlertTime = now;
            
            const alertDoc = await broadcastPushAlert({
              title: "AI Flood Warning",
              message: `High risk of flooding detected in ${city}. Expected probability: ${predictionData.flood_probability}%.`,
              severity: predictionData.risk_level || 'HIGH',
              source: 'AI_SYSTEM',
              village: city
            });
            
            getIO().emit('new_alert', alertDoc);
          } else {
            console.log(`AI Alert suppressed (Cooldown active). Next allowed after: ${new Date(lastAiAlertTime.getTime() + AI_COOLDOWN_HOURS * 60 * 60 * 1000).toLocaleString()}`);
          }
        }
      } catch (error) {
        console.error("Scheduled prediction failed:", (error as Error).message);
      }
    });
    console.log("Scheduled prediction job initialized.");
  };

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB Connection Initialized Successfully.");

    httpServer.listen(PORT, () => {
      console.log(`Server (HTTP + Socket) running on port ${PORT}`);
      startScheduledPredictions();
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

startServer();
