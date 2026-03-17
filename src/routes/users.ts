import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";

const router = Router();

// GET all admin users (superadmin only — auth enforced in index.ts)
router.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      komisariat: true,
      aktif: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

// POST create admin
router.post("/", async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.username || !body.nama) {
    res.status(400).json({ error: "Username dan nama wajib diisi" });
    return;
  }

  const username = String(body.username).trim();
  if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
    res.status(400).json({ error: "Username hanya boleh huruf, angka, underscore (3-50 karakter)" });
    return;
  }

  if (!body.password || body.password.length < 6) {
    res.status(400).json({ error: "Password wajib diisi minimal 6 karakter" });
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { username },
  });
  if (existing) {
    res.status(409).json({ error: "Username sudah terdaftar" });
    return;
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const newUser = await prisma.user.create({
    data: {
      nama: String(body.nama).trim().slice(0, 200),
      username,
      password: hashedPassword,
      role: "admin",
      komisariat: body.komisariat || null,
    },
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      komisariat: true,
      aktif: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(201).json(newUser);
});

// PUT update admin
router.put("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
  const body = req.body;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  // Whitelist allowed fields
  const updateData: Record<string, unknown> = {};
  if (body.nama !== undefined) updateData.nama = body.nama;
  if (body.komisariat !== undefined) updateData.komisariat = body.komisariat;
  if (body.aktif !== undefined) updateData.aktif = body.aktif;

  if (body.password && body.password.length >= 6) {
    updateData.password = await bcrypt.hash(body.password, 10);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      komisariat: true,
      aktif: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json(updated);
});

// DELETE admin
router.delete("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  if (user.role === "superadmin") {
    res.status(403).json({ error: "Tidak bisa menghapus superadmin" });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
