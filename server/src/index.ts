import dotenv from "dotenv";
dotenv.config();

import express from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import rateLimit from "express-rate-limit";

import animeListRouter from "./routes/animeList.js";
import tierListsRouter from "./routes/tierLists.js";
import usersRouter from "./routes/users.js";
import aiRecommendationsRouter from "./routes/aiRecommendations.js";
import aiSearchRouter from "./routes/aiSearch.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3232').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Global rate limit — 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Per-IP rate limit for AI endpoints — 5 requests per minute per IP
const aiPerIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait before making another request.' },
});

// Global daily AI budget — 200 requests/day across ALL users
let aiDailyCount = 0;
let aiDailyResetTime = Date.now() + 24 * 60 * 60 * 1000;

function aiDailyLimiter(req: any, res: any, next: any) {
  const now = Date.now();
  if (now >= aiDailyResetTime) {
    aiDailyCount = 0;
    aiDailyResetTime = now + 24 * 60 * 60 * 1000;
  }
  if (aiDailyCount >= 200) {
    res.status(429).json({
      error: 'Daily AI quota reached (200/day). Please try again tomorrow.',
      remaining: 0,
      resetsAt: new Date(aiDailyResetTime).toISOString(),
    });
    return;
  }
  aiDailyCount++;
  res.setHeader('X-AI-Daily-Remaining', String(200 - aiDailyCount));
  next();
}

app.use('/api/ai-recommendations', aiDailyLimiter, aiPerIpLimiter);
app.use('/api/ai-search', aiDailyLimiter, aiPerIpLimiter);

// API Routes
app.use("/api/anime-list", animeListRouter);
app.use("/api/tier-lists", tierListsRouter);
app.use("/api/users", usersRouter);
app.use("/api/ai-recommendations", aiRecommendationsRouter);
app.use("/api/ai-search", aiSearchRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
