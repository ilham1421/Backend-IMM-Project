import { Router, Request, Response } from "express";
import { readCollection, writeCollection, getNextId } from "../lib/storage.js";
import { authMiddleware } from "../middleware/auth.js";

type Komisariat = {
  id: number;
  nama: string;
  createdAt: string;
  updatedAt: string;
};

const router = Router();

// GET all komisariat
router.get("/", (_req: Request, res: Response) => {
  const items = readCollection<Komisariat>("komisariat");
  res.json(items);
});

// POST create new komisariat
router.post("/", authMiddleware, (req: Request, res: Response) => {
  const { nama } = req.body;
  if (!nama || !nama.trim()) {
    res.status(400).json({ error: "Nama komisariat wajib diisi" });
    return;
  }

  const items = readCollection<Komisariat>("komisariat");
  const exists = items.some(
    (k) => k.nama.toLowerCase() === nama.trim().toLowerCase()
  );
  if (exists) {
    res.status(409).json({ error: "Komisariat sudah ada" });
    return;
  }

  const newItem: Komisariat = {
    id: getNextId("komisariat"),
    nama: nama.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  items.push(newItem);
  writeCollection("komisariat", items);
  res.status(201).json(newItem);
});

// PUT update komisariat name
router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const items = readCollection<Komisariat>("komisariat");
  const index = items.findIndex((k) => k.id === Number(id));

  if (index === -1) {
    res.status(404).json({ error: "Komisariat tidak ditemukan" });
    return;
  }

  items[index] = {
    ...items[index],
    ...body,
    id: items[index].id,
    updatedAt: new Date().toISOString(),
  };

  writeCollection("komisariat", items);
  res.json(items[index]);
});

// DELETE komisariat
router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readCollection<Komisariat>("komisariat");
  const filtered = items.filter((k) => k.id !== Number(id));

  if (filtered.length === items.length) {
    res.status(404).json({ error: "Komisariat tidak ditemukan" });
    return;
  }

  writeCollection("komisariat", filtered);
  res.json({ success: true });
});

export default router;
