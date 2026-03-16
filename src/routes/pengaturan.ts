import { Router, Request, Response } from "express";
import { readSingleton, writeSingleton } from "../lib/storage.js";

type Pengaturan = {
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
  createdAt: string;
  updatedAt: string;
};

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  const pengaturan = readSingleton<Pengaturan>("pengaturan");
  if (!pengaturan) {
    res.status(404).json({ error: "Pengaturan belum diatur" });
    return;
  }
  res.json(pengaturan);
});

router.put("/", (req: Request, res: Response) => {
  const body = req.body;
  const existing = readSingleton<Pengaturan>("pengaturan");

  const updated: Pengaturan = {
    ...(existing || ({ id: 1, createdAt: new Date().toISOString() } as Pengaturan)),
    ...body,
    updatedAt: new Date().toISOString(),
  };

  writeSingleton("pengaturan", updated);
  res.json(updated);
});

export default router;
