import { Router, Request, Response } from "express";
import { readCollection } from "../lib/storage.js";

type Peserta = {
  id: number;
  kegiatanId: number;
  namaLengkap: string;
  komisariat: string;
  status: string;
  createdAt: string;
};

type Kegiatan = {
  id: number;
  namaKegiatan: string;
  singkatan: string;
  statusBuka: boolean;
  tanggalMulai: string;
  tanggalSelesai: string;
  lokasi: string;
  kuotaPeserta: number;
  batasRegistrasi: string;
};

const router = Router();

router.get("/stats", (req: Request, res: Response) => {
  const allPeserta = readCollection<Peserta>("peserta");
  const kegiatanList = readCollection<Kegiatan>("kegiatan");
  const kegiatanId = req.query.kegiatanId as string;
  const komisariat = req.query.komisariat as string;

  // Filter by kegiatan if specified
  let peserta = kegiatanId
    ? allPeserta.filter((p) => p.kegiatanId === Number(kegiatanId))
    : allPeserta;

  // Filter by komisariat if specified (for admin PIKOM)
  if (komisariat) {
    peserta = peserta.filter((p) => p.komisariat === komisariat);
  }

  const kegiatan = kegiatanId
    ? kegiatanList.find((k) => k.id === Number(kegiatanId)) || null
    : null;

  const totalPendaftar = peserta.length;
  const terverifikasi = peserta.filter((p) => p.status === "Terverifikasi").length;
  const menunggu = peserta.filter((p) => p.status === "Menunggu").length;
  const ditolak = peserta.filter((p) => p.status === "Ditolak").length;

  // Statistik per komisariat
  const komisariatMap: Record<string, { total: number; terverifikasi: number; menunggu: number; ditolak: number }> = {};
  for (const p of peserta) {
    if (!komisariatMap[p.komisariat]) {
      komisariatMap[p.komisariat] = { total: 0, terverifikasi: 0, menunggu: 0, ditolak: 0 };
    }
    komisariatMap[p.komisariat].total++;
    if (p.status === "Terverifikasi") komisariatMap[p.komisariat].terverifikasi++;
    if (p.status === "Menunggu") komisariatMap[p.komisariat].menunggu++;
    if (p.status === "Ditolak") komisariatMap[p.komisariat].ditolak++;
  }

  const komisariatStats = Object.entries(komisariatMap).map(([nama, stats]) => ({
    nama,
    ...stats,
  }));

  // Pendaftar terbaru
  const recentPeserta = [...peserta]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((p) => ({
      nama: p.namaLengkap,
      komisariat: p.komisariat,
      tanggal: new Date(p.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: p.status,
    }));

  // Filter totalKegiatan by komisariat if specified
  const filteredKegiatanCount = komisariat
    ? kegiatanList.filter((k: any) => (k.komisariatIds || []).some((id: number) => {
        const komisariatData = readCollection<any>("komisariat");
        const found = komisariatData.find((c: any) => c.id === id);
        return found && found.nama === komisariat;
      })).length
    : kegiatanList.length;

  res.json({
    totalPendaftar,
    terverifikasi,
    menunggu,
    ditolak,
    komisariatStats,
    recentPeserta,
    totalKegiatan: filteredKegiatanCount,
    kegiatan: kegiatan
      ? {
          statusBuka: kegiatan.statusBuka,
          namaKegiatan: kegiatan.namaKegiatan,
          tanggalMulai: kegiatan.tanggalMulai,
          tanggalSelesai: kegiatan.tanggalSelesai,
          lokasi: kegiatan.lokasi,
          kuotaPeserta: kegiatan.kuotaPeserta,
          batasRegistrasi: kegiatan.batasRegistrasi,
        }
      : null,
  });
});

export default router;
