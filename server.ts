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
import mapRoutes from "./backend/routes/mapRoutes";

import { fetchRainfallData } from "./backend/services/weatherService";
import { predictFlood } from "./backend/services/predictionService";

async function startServer() {
  // Validate critical environment variables
  const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter(env => !process.env[env]);
  
  if (missingEnv.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missingEnv.join(', ')}`);
    console.error('Please check your App Settings.');
  }

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Logger Middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Configure Robust CORS
  const allowedOrigins = [
    "https://flood-guard-real-time-flood-predict.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
  ];

  app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                        origin.includes("vercel.app") || 
                        origin.includes("localhost") || 
                        origin.includes("run.app");

      if (isAllowed) {
        return callback(null, true);
      } else {
        console.log("CORS Debug - Request from origin:", origin);
        // Temporarily allow all during debug to prevent white screen, but log it
        return callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  }));

  // Handle Preflight Requests
  app.options("*", cors());
  
  app.use(express.json());

  // API routes
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
    // Auto Flood Prediction Every 10 Minutes
    cron.schedule("*/10 * * * *", async () => {
      console.log("Running scheduled flood prediction check...");
      try {
        const city = "Sangli"; // Default monitoring city
        const weather = await fetchRainfallData(city);
        
        const predictionData = await predictFlood(
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
    console.log("Scheduled prediction job initialized.");
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB Connection Initialized Successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Start scheduled jobs only after DB connection
      startScheduledPredictions();
    });
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

startServer();
