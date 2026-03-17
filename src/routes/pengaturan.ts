import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

// GET (public)
router.get("/", async (_req: Request, res: Response) => {
  const pengaturan = await prisma.pengaturan.findUnique({ where: { id: 1 } });
  if (!pengaturan) {
    res.status(404).json({ error: "Pengaturan belum diatur" });
    return;
  }
  res.json(pengaturan);
});

// PUT (superadmin only — was previously unprotected!)
router.put("/", authMiddleware, roleMiddleware("superadmin"), async (req: Request, res: Response) => {
  const body = req.body;

  // Whitelist allowed fields
  const allowedFields = [
    "namaKegiatan", "singkatan", "deskripsi", "tanggalMulai",
    "tanggalSelesai", "lokasi", "kuotaPeserta", "batasRegistrasi", "statusBuka",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const updated = await prisma.pengaturan.upsert({
    where: { id: 1 },
    update: updateData,
    create: { id: 1, ...updateData } as any,
  });

  res.json(updated);
});

export default router;
