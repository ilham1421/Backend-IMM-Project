import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

// GET all komisariat (public)
router.get("/", async (_req: Request, res: Response) => {
  const items = await prisma.komisariat.findMany({
    orderBy: { nama: "asc" },
  });
  res.json(items);
});

// POST create (superadmin only)
router.post("/", authMiddleware, roleMiddleware("superadmin"), async (req: Request, res: Response) => {
  const { nama } = req.body;
  if (!nama || !nama.trim()) {
    res.status(400).json({ error: "Nama komisariat wajib diisi" });
    return;
  }

  const exists = await prisma.komisariat.findUnique({
    where: { nama: nama.trim() },
  });
  if (exists) {
    res.status(409).json({ error: "Komisariat sudah ada" });
    return;
  }

  const newItem = await prisma.komisariat.create({
    data: { nama: nama.trim() },
  });
  res.status(201).json(newItem);
});

// PUT update (superadmin only)
router.put("/:id", authMiddleware, roleMiddleware("superadmin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
  const { nama } = req.body;

  const existing = await prisma.komisariat.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Komisariat tidak ditemukan" });
    return;
  }

  const updated = await prisma.komisariat.update({
    where: { id },
    data: { nama: nama?.trim() || existing.nama },
  });
  res.json(updated);
});

// DELETE (superadmin only)
router.delete("/:id", authMiddleware, roleMiddleware("superadmin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const existing = await prisma.komisariat.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Komisariat tidak ditemukan" });
    return;
  }

  await prisma.komisariat.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
