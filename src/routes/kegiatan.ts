import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { authMiddleware, roleMiddleware } from "../middleware/auth.js";

const router = Router();

// GET all kegiatan (public, optional ?komisariat=FKIP filter)
router.get("/", async (req: Request, res: Response) => {
  const { komisariat } = req.query;

  const where: Record<string, unknown> = {};

  if (komisariat && typeof komisariat === "string") {
    where.komisariat = {
      some: {
        komisariat: { nama: komisariat },
      },
    };
  }

  const items = await prisma.kegiatan.findMany({
    where,
    include: {
      komisariat: { include: { komisariat: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform to match old API shape (komisariatIds array)
  const result = items.map((k) => ({
    ...k,
    komisariatIds: k.komisariat.map((kk) => kk.komisariatId),
    komisariat: undefined, // remove the relation object
  }));

  res.json(result);
});

// GET single kegiatan
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id },
    include: {
      komisariat: { include: { komisariat: true } },
    },
  });

  if (!kegiatan) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  res.json({
    ...kegiatan,
    komisariatIds: kegiatan.komisariat.map((kk) => kk.komisariatId),
    komisariat: undefined,
  });
});

// POST create (admin/superadmin)
router.post("/", authMiddleware, roleMiddleware("admin", "superadmin"), async (req: Request, res: Response) => {
  const body = req.body;
  if (!body.namaKegiatan || !body.singkatan) {
    res.status(400).json({ error: "Nama kegiatan dan singkatan wajib diisi" });
    return;
  }

  const singkatan = String(body.singkatan).trim();
  if (!/^[A-Za-z0-9]{1,20}$/.test(singkatan)) {
    res.status(400).json({ error: "Singkatan hanya boleh huruf dan angka (maks 20 karakter)" });
    return;
  }

  const kuota = Number(body.kuotaPeserta) || 100;
  if (!Number.isInteger(kuota) || kuota < 1) {
    res.status(400).json({ error: "Kuota peserta harus bilangan bulat positif" });
    return;
  }

  const komisariatIds: number[] = body.komisariatIds || [];

  const newItem = await prisma.kegiatan.create({
    data: {
      namaKegiatan: String(body.namaKegiatan).trim().slice(0, 200),
      singkatan,
      deskripsi: body.deskripsi || "",
      tanggalMulai: body.tanggalMulai || "",
      tanggalSelesai: body.tanggalSelesai || "",
      lokasi: body.lokasi || "",
      kuotaPeserta: kuota,
      batasRegistrasi: body.batasRegistrasi || "",
      statusBuka: body.statusBuka ?? false,
      komisariat: {
        create: komisariatIds.map((kid: number) => ({
          komisariatId: kid,
        })),
      },
    },
    include: {
      komisariat: { include: { komisariat: true } },
    },
  });

  res.status(201).json({
    ...newItem,
    komisariatIds: newItem.komisariat.map((kk) => kk.komisariatId),
    komisariat: undefined,
  });
});

// PUT update
router.put("/:id", authMiddleware, roleMiddleware("admin", "superadmin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }
  const body = req.body;

  const existing = await prisma.kegiatan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  // Whitelist allowed fields
  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "namaKegiatan", "singkatan", "deskripsi", "tanggalMulai",
    "tanggalSelesai", "lokasi", "kuotaPeserta", "batasRegistrasi", "statusBuka",
  ];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  // Handle komisariatIds relation update inside transaction
  if (body.komisariatIds) {
    await prisma.$transaction([
      prisma.kegiatanKomisariat.deleteMany({ where: { kegiatanId: id } }),
      prisma.kegiatanKomisariat.createMany({
        data: body.komisariatIds.map((kid: number) => ({
          kegiatanId: id,
          komisariatId: kid,
        })),
      }),
    ]);
  }

  const updated = await prisma.kegiatan.update({
    where: { id },
    data: updateData,
    include: {
      komisariat: { include: { komisariat: true } },
    },
  });

  res.json({
    ...updated,
    komisariatIds: updated.komisariat.map((kk) => kk.komisariatId),
    komisariat: undefined,
  });
});

// DELETE
router.delete("/:id", authMiddleware, roleMiddleware("admin", "superadmin"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID tidak valid" }); return; }

  const existing = await prisma.kegiatan.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  await prisma.kegiatan.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
