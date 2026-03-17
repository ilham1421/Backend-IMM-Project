import "dotenv/config";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import pengaturanRoutes from "./routes/pengaturan.js";
import persyaratanRoutes from "./routes/persyaratan.js";
import pesertaRoutes from "./routes/peserta.js";
import usersRoutes from "./routes/users.js";
import dashboardRoutes from "./routes/dashboard.js";
import komisariatRoutes from "./routes/komisariat.js";
import kegiatanRoutes from "./routes/kegiatan.js";
import { authMiddleware, roleMiddleware, JWT_SECRET } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Response compression
app.use(compression());

// Request logging
app.use(morgan("combined"));

// CORS
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));

// Body parsing
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Rate limiting — global: 200 req/min per IP
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak request. Coba lagi nanti." },
});
app.use(globalLimiter);

// Stricter rate limit for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
});

// Auth rate limit (login): 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
});

// Serve uploaded files — protected: verify JWT token
app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.query.token as string;
  if (!token) {
    res.status(401).json({ error: "Akses tidak diizinkan" });
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
}, express.static(path.join(__dirname, "..", "uploads")));

// Public routes (no auth required)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/komisariat", komisariatRoutes);
app.use("/api/kegiatan", kegiatanRoutes);
app.use("/api/persyaratan", persyaratanRoutes);
app.use("/api/pengaturan", pengaturanRoutes);
app.use("/api/peserta", pesertaRoutes);

// Protected routes (auth required)
app.use("/api/users", authMiddleware, roleMiddleware("superadmin"), usersRoutes);
app.use("/api/dashboard", authMiddleware, dashboardRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Error]", err.message);
  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Terjadi kesalahan internal"
      : err.message,
  });
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Backend berjalan di http://localhost:${PORT}`);
});
