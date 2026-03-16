import { Router, Request, Response } from "express";
import { readCollection, writeCollection, getNextId } from "../lib/storage.js";
import { authMiddleware } from "../middleware/auth.js";

type Komisariat = {
  id: number;
  nama: string;
};

type Kegiatan = {
  id: number;
  namaKegiatan: string;
  singkatan: string;
  deskripsi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  kuotaPeserta: number;
  batasRegistrasi: string;
  statusBuka: boolean;
  komisariatIds: number[];
  createdAt: string;
  updatedAt: string;
};

const router = Router();

// GET all kegiatan (optional ?komisariat=FKIP to filter by komisariat name)
router.get("/", (req: Request, res: Response) => {
  let items = readCollection<Kegiatan>("kegiatan");

  const { komisariat } = req.query;
  if (komisariat && typeof komisariat === "string") {
    const allKomisariat = readCollection<Komisariat>("komisariat");
    const found = allKomisariat.find((k) => k.nama === komisariat);
    if (found) {
      items = items.filter((kg) => kg.komisariatIds.includes(found.id));
    } else {
      items = [];
    }
  }

  res.json(items);
});

// GET single kegiatan
router.get("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readCollection<Kegiatan>("kegiatan");
  const kegiatan = items.find((k) => k.id === Number(id));

  if (!kegiatan) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  res.json(kegiatan);
});

// POST create new kegiatan
router.post("/", authMiddleware, (req: Request, res: Response) => {
  const body = req.body;
  if (!body.namaKegiatan || !body.singkatan) {
    res.status(400).json({ error: "Nama kegiatan dan singkatan wajib diisi" });
    return;
  }

  const items = readCollection<Kegiatan>("kegiatan");

  const newItem: Kegiatan = {
    id: getNextId("kegiatan"),
    namaKegiatan: body.namaKegiatan,
    singkatan: body.singkatan,
    deskripsi: body.deskripsi || "",
    tanggalMulai: body.tanggalMulai || "",
    tanggalSelesai: body.tanggalSelesai || "",
    lokasi: body.lokasi || "",
    kuotaPeserta: body.kuotaPeserta || 100,
    batasRegistrasi: body.batasRegistrasi || "",
    statusBuka: body.statusBuka ?? false,
    komisariatIds: body.komisariatIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);
  writeCollection("kegiatan", items);
  res.status(201).json(newItem);
});

// PUT update kegiatan
router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const items = readCollection<Kegiatan>("kegiatan");
  const index = items.findIndex((k) => k.id === Number(id));

  if (index === -1) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  items[index] = {
    ...items[index],
    ...body,
    id: items[index].id,
    updatedAt: new Date().toISOString(),
  };

  writeCollection("kegiatan", items);
  res.json(items[index]);
});

// DELETE kegiatan
router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readCollection<Kegiatan>("kegiatan");
  const filtered = items.filter((k) => k.id !== Number(id));

  if (filtered.length === items.length) {
    res.status(404).json({ error: "Kegiatan tidak ditemukan" });
    return;
  }

  writeCollection("kegiatan", filtered);
  res.json({ success: true });
});

export default router;
