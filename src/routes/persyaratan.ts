import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

// GET all persyaratan (public, filtered by kegiatanId)
router.get("/", async (req: Request, res: Response) => {
  const { kegiatanId } = req.query;

  const where: Record<string, unknown> = { aktif: true };
  if (kegiatanId) {
    where.kegiatanId = Number(kegiatanId);
  }

  const items = await prisma.persyaratan.findMany({
    where,
    orderBy: { urutan: "asc" },
  });

  res.json(items);
});

// POST create (admin/superadmin)
router.post("/", authMiddleware, roleMiddleware("admin", "superadmin"), async (req: Request, res: Response) => {
  const body = req.body;

  if (!body.kegiatanId) {
    res.status(400).json({ error: "kegiatanId wajib diisi" });
    return;
  }

  if (!body.nama || !String(body.nama).trim()) {
    res.status(400).json({ error: "Nama persyaratan wajib diisi" });
    return;
  }

  const allowedJenis = ["file", "teks", "checkbox", "paragraf", "pilihan_ganda"];
  const jenis = body.jenis || "file";
  if (!allowedJenis.includes(jenis)) {
    res.status(400).json({ error: `Jenis harus salah satu dari: ${allowedJenis.join(", ")}` });
    return;
  }

  const count = await prisma.persyaratan.count({
    where: { kegiatanId: Number(body.kegiatanId) },
  });

  const newItem = await prisma.persyaratan.create({
    data: {
      kegiatanId: Number(body.kegiatanId),
      nama: String(body.nama).trim().slice(0, 200),
      jenis,
      wajib: body.wajib ?? true,
      opsi: body.opsi || undefined,
      urutan: body.urutan ?? count + 1,
    },
  });

  res.status(201).json(newItem);
});

// PUT update (admin/superadmin)
router.put("/:id", authMiddleware, roleMiddleware("admin", "superadmin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
  const body = req.body;

  const existing = await prisma.persyaratan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  // Whitelist allowed fields
  const updateData: Record<string, unknown> = {};
  const allowedFields = ["nama", "jenis", "wajib", "opsi", "urutan", "aktif"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const updated = await prisma.persyaratan.update({
    where: { id },
    data: updateData,
  });

  res.json(updated);
});

// DELETE (admin/superadmin)
router.delete("/:id", authMiddleware, roleMiddleware("admin", "superadmin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const existing = await prisma.persyaratan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  await prisma.persyaratan.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
