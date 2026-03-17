import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import prisma from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendStatusChangeEmail } from "../lib/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

const allowedMimes: Record<string, string[]> = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".pdf": ["application/pdf"],
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const validMimes = allowedMimes[ext];
    if (validMimes && validMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Format file tidak didukung. Gunakan JPG, PNG, atau PDF."));
    }
  },
});

// Rate limit for public registration
const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak pendaftaran. Coba lagi dalam 15 menit." },
});

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Public: cek status pendaftaran
router.get("/cek-status/:noPendaftaran", async (req: Request, res: Response) => {
  const noPendaftaran = req.params.noPendaftaran as string;

  const peserta = await prisma.peserta.findUnique({
    where: { noPendaftaran },
    include: { kegiatan: { select: { singkatan: true } } },
  });

  if (!peserta) {
    res.status(404).json({ error: "Nomor pendaftaran tidak ditemukan" });
    return;
  }

  // Return limited public info only
  res.json({
    noPendaftaran: peserta.noPendaftaran,
    namaLengkap: peserta.namaLengkap,
    komisariat: peserta.komisariat,
    kegiatan: peserta.kegiatan?.singkatan || "-",
    status: peserta.status,
    createdAt: peserta.createdAt,
    updatedAt: peserta.updatedAt,
  });
});

// Public: registration
router.post("/", registrationLimiter, upload.array("berkas", 10), async (req: Request, res: Response) => {
  const body = req.body;

  // Input validation
  if (!body.namaLengkap || !body.nim || !body.email || !body.kegiatanId) {
    res.status(400).json({ error: "Nama lengkap, NIM, email, dan kegiatan wajib diisi" });
    return;
  }

  // Field length validation
  const maxLen: Record<string, number> = { namaLengkap: 200, nim: 30, email: 100, alamat: 500, universitas: 200, fakultas: 200, prodi: 200, komisariat: 200, tempatLahir: 100, noHp: 20 };
  for (const [field, max] of Object.entries(maxLen)) {
    if (body[field] && String(body[field]).length > max) {
      res.status(400).json({ error: `${field} terlalu panjang (maks ${max} karakter)` });
      return;
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    res.status(400).json({ error: "Format email tidak valid" });
    return;
  }

  const kegiatanId = Number(body.kegiatanId);

  // Validate kegiatan exists, is open, within deadline, and has quota
  const kegiatan = await prisma.kegiatan.findUnique({
    where: { id: kegiatanId },
    include: { _count: { select: { peserta: true } } },
  });

  if (!kegiatan) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  if (!kegiatan.statusBuka) {
    res.status(400).json({ error: "Pendaftaran untuk kegiatan ini sudah ditutup" });
    return;
  }

  if (kegiatan.batasRegistrasi) {
    const deadline = new Date(kegiatan.batasRegistrasi);
    if (!isNaN(deadline.getTime()) && new Date() > deadline) {
      res.status(400).json({ error: "Batas waktu pendaftaran sudah lewat" });
      return;
    }
  }

  if (kegiatan._count.peserta >= kegiatan.kuotaPeserta) {
    res.status(400).json({ error: "Kuota peserta untuk kegiatan ini sudah penuh" });
    return;
  }

  // Check duplicate NIM or email per kegiatan
  const duplicate = await prisma.peserta.findFirst({
    where: {
      kegiatanId,
      OR: [{ nim: body.nim }, { email: body.email }],
    },
  });

  if (duplicate) {
    const field = duplicate.nim === body.nim ? "NIM" : "Email";
    res.status(409).json({
      error: `${field} sudah terdaftar pada kegiatan ini dengan nomor pendaftaran ${duplicate.noPendaftaran}.`,
    });
    return;
  }

  // Use kegiatan data (already fetched above) for noPendaftaran prefix
  const prefix = kegiatan.singkatan || "REG";
  const year = new Date().getFullYear();

  // Process uploaded files
  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  const berkasNames: string[] = body.berkasNames
    ? (Array.isArray(body.berkasNames) ? body.berkasNames : [body.berkasNames])
    : [];

  const berkas = uploadedFiles.map((file, i) => ({
    namaBerkas: berkasNames[i] || file.originalname,
    namaFile: file.filename,
    originalName: path.basename(file.originalname).slice(0, 200),
  }));

  // Parse jawaban safely
  let jawaban: unknown[] = [];
  if (body.jawaban) {
    try {
      jawaban = JSON.parse(body.jawaban);
    } catch {
      res.status(400).json({ error: "Format jawaban tidak valid" });
      return;
    }
  }

  // Generate noPendaftaran atomically inside a transaction to avoid race conditions
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const newPeserta = await prisma.$transaction(async (tx) => {
        const count = await tx.peserta.count({ where: { kegiatanId } });
        const noPendaftaran = `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;

        return tx.peserta.create({
          data: {
            noPendaftaran,
            kegiatanId,
            namaLengkap: body.namaLengkap,
            nim: body.nim,
            tempatLahir: body.tempatLahir || "",
            tanggalLahir: body.tanggalLahir || "",
            jenisKelamin: body.jenisKelamin || "",
            email: body.email,
            noHp: body.noHp || "",
            universitas: body.universitas || "",
            fakultas: body.fakultas || "",
            prodi: body.prodi || "",
            komisariat: body.komisariat || "",
            alamat: body.alamat || "",
            berkas: berkas as unknown as import("@prisma/client").Prisma.InputJsonValue,
            jawaban: jawaban as unknown as import("@prisma/client").Prisma.InputJsonValue,
          },
        });
      }, { isolationLevel: "Serializable" });

      res.status(201).json(newPeserta);
      return;
    } catch (err: unknown) {
      // Unique constraint violation on noPendaftaran — retry
      if (err && typeof err === "object" && "code" in err && err.code === "P2002" && attempt < maxRetries - 1) continue;
      throw err;
    }
  }
});

// ==================== PROTECTED ROUTES ====================

// Export CSV
router.get("/export/csv", authMiddleware, async (req: Request, res: Response) => {
  const where: Record<string, unknown> = {};
  const status = req.query.status as string;
  const komisariat = req.query.komisariat as string;
  const kegiatanId = req.query.kegiatanId as string;

  if (kegiatanId) where.kegiatanId = Number(kegiatanId);
  if (status && status !== "semua") where.status = status;
  if (komisariat) where.komisariat = komisariat;

  const items = await prisma.peserta.findMany({
    where,
    include: { kegiatan: { select: { singkatan: true } } },
    orderBy: { createdAt: "desc" },
  });

  const escapeCsv = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headers = [
    "No", "No Pendaftaran", "Nama Lengkap", "NIM", "Tempat Lahir",
    "Tanggal Lahir", "Jenis Kelamin", "Email", "No HP", "Universitas",
    "Fakultas", "Prodi", "Komisariat", "Alamat", "Kegiatan", "Status", "Tanggal Daftar",
  ];

  const rows = items.map((p, i) => [
    String(i + 1),
    p.noPendaftaran,
    p.namaLengkap,
    p.nim,
    p.tempatLahir,
    p.tanggalLahir,
    p.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
    p.email,
    p.noHp,
    p.universitas,
    p.fakultas,
    p.prodi,
    p.komisariat,
    p.alamat,
    p.kegiatan?.singkatan || "-",
    p.status,
    new Date(p.createdAt).toLocaleDateString("id-ID"),
  ].map(escapeCsv).join(","));

  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=peserta-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

// GET all peserta (supports optional pagination via ?page=&limit=)
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const search = (req.query.search as string)?.toLowerCase();
  const status = req.query.status as string;
  const komisariat = req.query.komisariat as string;
  const kegiatanId = req.query.kegiatanId as string;
  const usePagination = req.query.page !== undefined;

  const where: Record<string, unknown> = {};

  if (kegiatanId) where.kegiatanId = Number(kegiatanId);
  if (status && status !== "semua") where.status = status;
  if (komisariat) where.komisariat = komisariat;

  if (search) {
    where.OR = [
      { namaLengkap: { contains: search, mode: "insensitive" } },
      { nim: { contains: search } },
      { komisariat: { contains: search, mode: "insensitive" } },
    ];
  }

  if (usePagination) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

    const [items, total] = await Promise.all([
      prisma.peserta.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.peserta.count({ where }),
    ]);

    res.json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } else {
    // Backward compatible: return flat array
    const items = await prisma.peserta.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(items);
  }
});

// GET single peserta
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  // Don't match "export" or "cek-status" as IDs
  if (isNaN(Number(id))) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }

  const peserta = await prisma.peserta.findUnique({
    where: { id: Number(id) },
  });

  if (!peserta) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  res.json(peserta);
});

// PUT update peserta (admin/superadmin — whitelist fields)
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  const existing = await prisma.peserta.findUnique({
    where: { id: Number(id) },
  });

  if (!existing) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  const oldStatus = existing.status;
  const newStatus = body.status;

  // Validate status value
  const allowedStatuses = ["Menunggu", "Terverifikasi", "Ditolak"];
  if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
    res.status(400).json({ error: `Status tidak valid. Gunakan: ${allowedStatuses.join(", ")}` });
    return;
  }

  // Admin can only update peserta within their komisariat
  if (req.user?.role === "admin" && existing.komisariat !== req.user.komisariat) {
    res.status(403).json({ error: "Anda hanya dapat mengubah peserta di komisariat Anda" });
    return;
  }

  // Whitelist: only allow updating status
  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;

  const updated = await prisma.peserta.update({
    where: { id: Number(id) },
    data: updateData,
  });

  // Audit log & email if status changed
  if (newStatus && newStatus !== oldStatus) {
    const emailSent = await sendStatusChangeEmail(
      updated.email,
      updated.namaLengkap,
      updated.noPendaftaran,
      newStatus
    );

    await prisma.statusLog.create({
      data: {
        pesertaId: updated.id,
        noPendaftaran: updated.noPendaftaran,
        statusLama: oldStatus,
        statusBaru: newStatus,
        diubahOleh: req.user?.username || "unknown",
        role: req.user?.role || "unknown",
        emailTerkirim: emailSent,
      },
    });
  }

  res.json(updated);
});

// DELETE peserta
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.peserta.findUnique({
    where: { id: Number(id) },
  });

  if (!existing) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  // Admin can only delete peserta within their komisariat
  if (req.user?.role === "admin" && existing.komisariat !== req.user.komisariat) {
    res.status(403).json({ error: "Anda hanya dapat menghapus peserta di komisariat Anda" });
    return;
  }

  // Clean up uploaded files
  if (existing.berkas && Array.isArray(existing.berkas)) {
    for (const b of existing.berkas as Array<{ namaFile?: string }>) {
      if (b.namaFile) {
        const filePath = path.join(uploadsDir, path.basename(b.namaFile));
        fs.unlink(filePath, () => {});
      }
    }
  }

  await prisma.peserta.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

// Audit log: status change history per peserta
router.get("/:id/logs", authMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;

  const logs = await prisma.statusLog.findMany({
    where: { pesertaId: Number(id) },
    orderBy: { waktu: "desc" },
  });

  res.json(logs);
});

export default router;
