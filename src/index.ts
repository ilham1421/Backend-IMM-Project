import express from "express";
import cors from "cors";
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
import { authMiddleware, roleMiddleware } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Public routes (no auth required)
app.use("/api/auth", authRoutes);
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

app.listen(PORT, () => {
  console.log(`🚀 Backend berjalan di http://localhost:${PORT}`);
});
