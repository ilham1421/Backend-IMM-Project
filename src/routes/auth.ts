import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username dan password wajib diisi" });
    return;
  }

  const trimmedUsername = String(username).trim().slice(0, 100);
  const user = await prisma.user.findUnique({ where: { username: trimmedUsername } });

  if (!user) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  if (!user.aktif) {
    res.status(403).json({ error: "Akun tidak aktif. Hubungi superadmin." });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const { password: _, ...userWithoutPassword } = user;

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, komisariat: user.komisariat },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({ user: userWithoutPassword, token });
});

export default router;
