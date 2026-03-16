import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { readCollection, writeCollection, getNextId } from "../lib/storage.js";
import { authMiddleware } from "../middleware/auth.js";

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Format file tidak didukung"));
    }
  },
});

type Kegiatan = {
  id: number;
  singkatan: string;
};

type Peserta = {
  id: number;
  noPendaftaran: string;
  kegiatanId: number;
  namaLengkap: string;
  nim: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  email: string;
  noHp: string;
  universitas: string;
  fakultas: string;
  prodi: string;
  komisariat: string;
  alamat: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  berkas: { namaBerkas: string; namaFile: string; originalName?: string }[];
};

const router = Router();

router.get("/", authMiddleware, (req: Request, res: Response) => {
  const items = readCollection<Peserta>("peserta");

  const search = (req.query.search as string)?.toLowerCase();
  const status = req.query.status as string;
  const komisariat = req.query.komisariat as string;
  const kegiatanId = req.query.kegiatanId as string;

  let filtered = items;

  if (kegiatanId) {
    filtered = filtered.filter((p) => p.kegiatanId === Number(kegiatanId));
  }

  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.namaLengkap.toLowerCase().includes(search) ||
        p.nim.includes(search) ||
        p.komisariat.toLowerCase().includes(search)
    );
  }

  if (status && status !== "semua") {
    filtered = filtered.filter((p) => p.status === status);
  }

  if (komisariat) {
    filtered = filtered.filter((p) => p.komisariat === komisariat);
  }

  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(filtered);
});

router.get("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readCollection<Peserta>("peserta");
  const peserta = items.find((p) => p.id === Number(id));

  if (!peserta) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  res.json(peserta);
});

router.post("/", upload.array("berkas", 10), (req: Request, res: Response) => {
  const body = req.body;
  const items = readCollection<Peserta>("peserta");

  const nextId = getNextId("peserta");

  // Generate noPendaftaran from kegiatan singkatan
  const kegiatanList = readCollection<Kegiatan>("kegiatan");
  const kegiatan = kegiatanList.find((k) => k.id === Number(body.kegiatanId));
  const prefix = kegiatan?.singkatan || "REG";
  const year = new Date().getFullYear();
  const noPendaftaran = `${prefix}-${year}-${String(nextId).padStart(4, "0")}`;

  // Process uploaded files
  const uploadedFiles = (req.files as Express.Multer.File[]) || [];
  const berkasNames: string[] = body.berkasNames
    ? (Array.isArray(body.berkasNames) ? body.berkasNames : [body.berkasNames])
    : [];

  const berkas = uploadedFiles.map((file, i) => ({
    namaBerkas: berkasNames[i] || file.originalname,
    namaFile: file.filename,
    originalName: file.originalname,
  }));

  const newPeserta: Peserta = {
    id: nextId,
    noPendaftaran,
    kegiatanId: Number(body.kegiatanId) || 0,
    namaLengkap: body.namaLengkap,
    nim: body.nim,
    tempatLahir: body.tempatLahir,
    tanggalLahir: body.tanggalLahir,
    jenisKelamin: body.jenisKelamin,
    email: body.email,
    noHp: body.noHp,
    universitas: body.universitas,
    fakultas: body.fakultas,
    prodi: body.prodi,
    komisariat: body.komisariat,
    alamat: body.alamat,
    status: "Menunggu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    berkas,
  };

  items.push(newPeserta);
  writeCollection("peserta", items);
  res.status(201).json(newPeserta);
});

router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const items = readCollection<Peserta>("peserta");
  const index = items.findIndex((p) => p.id === Number(id));

  if (index === -1) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  items[index] = {
    ...items[index],
    ...body,
    id: items[index].id,
    noPendaftaran: items[index].noPendaftaran,
    updatedAt: new Date().toISOString(),
  };

  writeCollection("peserta", items);
  res.json(items[index]);
});

router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readCollection<Peserta>("peserta");
  const filtered = items.filter((p) => p.id !== Number(id));

  if (filtered.length === items.length) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  writeCollection("peserta", filtered);
  res.json({ success: true });
});

export default router;
