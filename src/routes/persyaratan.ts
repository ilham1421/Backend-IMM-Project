import { Router, Request, Response } from "express";
import { readCollection, writeCollection, getNextId } from "../lib/storage.js";
import { authMiddleware } from "../middleware/auth.js";

type Persyaratan = {
  id: number;
  kegiatanId: number;
  nama: string;
  jenis: string;
  wajib: boolean;
  urutan: number;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
};

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const items = readCollection<Persyaratan>("persyaratan");
  const { kegiatanId } = req.query;

  let filtered = items.filter((i) => i.aktif);

  if (kegiatanId) {
    filtered = filtered.filter((i) => i.kegiatanId === Number(kegiatanId));
  }

  const sorted = filtered.sort((a, b) => a.urutan - b.urutan);
  res.json(sorted);
});

router.post("/", authMiddleware, (req: Request, res: Response) => {
  const body = req.body;
  const items = readCollection<Persyaratan>("persyaratan");

  if (!body.kegiatanId) {
    res.status(400).json({ error: "kegiatanId wajib diisi" });
    return;
  }

  const newItem: Persyaratan = {
    id: getNextId("persyaratan"),
    kegiatanId: Number(body.kegiatanId),
    nama: body.nama,
    jenis: body.jenis || "file",
    wajib: body.wajib ?? true,
    urutan: body.urutan ?? items.length + 1,
    aktif: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);
  writeCollection("persyaratan", items);
  res.status(201).json(newItem);
});

router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const items = readCollection<Persyaratan>("persyaratan");
  const index = items.findIndex((i) => i.id === Number(id));

  if (index === -1) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  items[index] = {
    ...items[index],
    ...body,
    id: items[index].id,
    updatedAt: new Date().toISOString(),
  };

  writeCollection("persyaratan", items);
  res.json(items[index]);
});

router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readCollection<Persyaratan>("persyaratan");
  const filtered = items.filter((i) => i.id !== Number(id));

  if (filtered.length === items.length) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }

  writeCollection("persyaratan", filtered);
  res.json({ success: true });
});

export default router;
