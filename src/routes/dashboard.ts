import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/stats", async (req: Request, res: Response) => {
  const kegiatanId = req.query.kegiatanId as string;
  const komisariat = req.query.komisariat as string;

  // Build peserta filter
  const pesertaWhere: Record<string, unknown> = {};
  if (kegiatanId && !isNaN(Number(kegiatanId))) pesertaWhere.kegiatanId = Number(kegiatanId);
  if (komisariat) pesertaWhere.komisariat = komisariat;

  // Use groupBy for status counts instead of loading all records
  const statusCounts = await prisma.peserta.groupBy({
    by: ["status"],
    where: pesertaWhere,
    _count: true,
  });

  const totalPendaftar = statusCounts.reduce((sum, s) => sum + s._count, 0);
  const terverifikasi = statusCounts.find((s) => s.status === "Terverifikasi")?._count || 0;
  const menunggu = statusCounts.find((s) => s.status === "Menunggu")?._count || 0;
  const ditolak = statusCounts.find((s) => s.status === "Ditolak")?._count || 0;

  // Komisariat stats using groupBy
  const komisariatStatusCounts = await prisma.peserta.groupBy({
    by: ["komisariat", "status"],
    where: pesertaWhere,
    _count: true,
  });

  const komisariatMap: Record<string, { total: number; terverifikasi: number; menunggu: number; ditolak: number }> = {};
  for (const row of komisariatStatusCounts) {
    if (!komisariatMap[row.komisariat]) {
      komisariatMap[row.komisariat] = { total: 0, terverifikasi: 0, menunggu: 0, ditolak: 0 };
    }
    komisariatMap[row.komisariat].total += row._count;
    if (row.status === "Terverifikasi") komisariatMap[row.komisariat].terverifikasi = row._count;
    if (row.status === "Menunggu") komisariatMap[row.komisariat].menunggu = row._count;
    if (row.status === "Ditolak") komisariatMap[row.komisariat].ditolak = row._count;
  }

  const komisariatStats = Object.entries(komisariatMap).map(([nama, stats]) => ({
    nama,
    ...stats,
  }));

  // Recent peserta (max 5) — only load 5 records
  const recentPesertaRaw = await prisma.peserta.findMany({
    where: pesertaWhere,
    select: {
      namaLengkap: true,
      komisariat: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const recentPeserta = recentPesertaRaw.map((p) => ({
    nama: p.namaLengkap,
    komisariat: p.komisariat,
    tanggal: new Date(p.createdAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status: p.status,
  }));

  // Count kegiatan (filtered by komisariat if needed)
  let filteredKegiatanCount: number;
  if (komisariat) {
    filteredKegiatanCount = await prisma.kegiatan.count({
      where: {
        komisariat: {
          some: {
            komisariat: { nama: komisariat },
          },
        },
      },
    });
  } else {
    filteredKegiatanCount = await prisma.kegiatan.count();
  }

  // Get kegiatan detail if specified
  let kegiatan = null;
  if (kegiatanId) {
    const kg = await prisma.kegiatan.findUnique({
      where: { id: Number(kegiatanId) },
    });
    if (kg) {
      kegiatan = {
        statusBuka: kg.statusBuka,
        namaKegiatan: kg.namaKegiatan,
        tanggalMulai: kg.tanggalMulai,
        tanggalSelesai: kg.tanggalSelesai,
        lokasi: kg.lokasi,
        kuotaPeserta: kg.kuotaPeserta,
        batasRegistrasi: kg.batasRegistrasi,
      };
    }
  }

  res.json({
    totalPendaftar,
    terverifikasi,
    menunggu,
    ditolak,
    komisariatStats,
    recentPeserta,
    totalKegiatan: filteredKegiatanCount,
    kegiatan,
  });
});

export default router;
