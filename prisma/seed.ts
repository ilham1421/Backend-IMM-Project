import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Mulai seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Users
  const users = [
    { nama: "Super Administrator", username: "superadmin", password: hashedPassword, role: "superadmin", komisariat: null, aktif: true },
    { nama: "Hasan Basri", username: "admin_fkip", password: hashedPassword, role: "admin", komisariat: "FKIP", aktif: true },
    { nama: "Aisyah Putri", username: "admin_feb", password: hashedPassword, role: "admin", komisariat: "FEB", aktif: true },
    { nama: "Umar Faruq", username: "admin_ft", password: hashedPassword, role: "admin", komisariat: "FT", aktif: true },
    { nama: "Khadijah Sari", username: "admin_fisip", password: hashedPassword, role: "admin", komisariat: "FISIP", aktif: true },
    { nama: "Zainab Fitri", username: "admin_fk", password: hashedPassword, role: "admin", komisariat: "FK", aktif: true },
    { nama: "Abdullah Hakim", username: "admin_fai", password: hashedPassword, role: "admin", komisariat: "FAI", aktif: true },
    { nama: "Salma Azzahra", username: "admin_fh", password: hashedPassword, role: "admin", komisariat: "FH", aktif: true },
    { nama: "Ridwan Kamil", username: "admin_fikes", password: hashedPassword, role: "admin", komisariat: "FIKES", aktif: true },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: u,
    });
  }
  console.log("✅ Users dibuat");

  // 2. Komisariat
  const komisariatNames = ["FKIP", "FEB", "FT", "FISIP", "FK", "FAI", "FH", "FIKES"];
  const komisariatMap: Record<string, number> = {};

  for (const nama of komisariatNames) {
    const k = await prisma.komisariat.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
    komisariatMap[nama] = k.id;
  }
  console.log("✅ Komisariat dibuat");

  // 3. Kegiatan + junction table
  const kegiatanData = [
    {
      namaKegiatan: "Darul Arqam Dasar 2026 - FKIP",
      singkatan: "DAD",
      deskripsi: "Perkaderan utama IMM Komisariat FKIP untuk membentuk kader militan, intelektual, dan berakhlak mulia.",
      tanggalMulai: "2026-04-15",
      tanggalSelesai: "2026-04-17",
      lokasi: "Gedung FKIP, Universitas Muhammadiyah Jakarta",
      kuotaPeserta: 30,
      batasRegistrasi: "2026-04-10",
      statusBuka: true,
      komisariatNames: ["FKIP"],
    },
    {
      namaKegiatan: "Darul Arqam Dasar 2026 - FT",
      singkatan: "DAD",
      deskripsi: "Perkaderan utama IMM Komisariat FT untuk membentuk kader militan, intelektual, dan berakhlak mulia.",
      tanggalMulai: "2026-04-20",
      tanggalSelesai: "2026-04-22",
      lokasi: "Gedung FT, Universitas Muhammadiyah Jakarta",
      kuotaPeserta: 25,
      batasRegistrasi: "2026-04-15",
      statusBuka: true,
      komisariatNames: ["FT"],
    },
    {
      namaKegiatan: "Darul Arqam Madya 2026 - FKIP",
      singkatan: "DAM",
      deskripsi: "Perkaderan lanjutan IMM Komisariat FKIP untuk memperdalam wawasan keislaman dan kepemimpinan.",
      tanggalMulai: "2026-06-10",
      tanggalSelesai: "2026-06-13",
      lokasi: "Gedung FKIP, Universitas Muhammadiyah Jakarta",
      kuotaPeserta: 20,
      batasRegistrasi: "2026-06-05",
      statusBuka: false,
      komisariatNames: ["FKIP"],
    },
  ];

  const kegiatanIds: number[] = [];
  for (const kg of kegiatanData) {
    const { komisariatNames: kNames, ...data } = kg;
    const created = await prisma.kegiatan.create({ data });
    kegiatanIds.push(created.id);

    // Create junction records
    for (const kn of kNames) {
      await prisma.kegiatanKomisariat.create({
        data: { kegiatanId: created.id, komisariatId: komisariatMap[kn] },
      });
    }
  }
  console.log("✅ Kegiatan dibuat");

  // 4. Persyaratan
  const persyaratanData = [
    // DAD FKIP (kegiatanId: kegiatanIds[0])
    { kegiatanId: kegiatanIds[0], nama: "Scan KTA (Kartu Tanda Anggota)", jenis: "file", wajib: true, urutan: 1, aktif: true },
    { kegiatanId: kegiatanIds[0], nama: "Scan KTM (Kartu Tanda Mahasiswa)", jenis: "file", wajib: true, urutan: 2, aktif: true },
    { kegiatanId: kegiatanIds[0], nama: "Pas Foto 3x4 Background Merah", jenis: "file", wajib: true, urutan: 3, aktif: true },
    { kegiatanId: kegiatanIds[0], nama: "Alasan mengikuti DAD", jenis: "teks", wajib: true, urutan: 4, aktif: true },
    { kegiatanId: kegiatanIds[0], nama: "Bersedia mengikuti seluruh rangkaian kegiatan", jenis: "checkbox", wajib: true, urutan: 5, aktif: true },
    // DAD FT (kegiatanId: kegiatanIds[1])
    { kegiatanId: kegiatanIds[1], nama: "Scan KTA (Kartu Tanda Anggota)", jenis: "file", wajib: true, urutan: 1, aktif: true },
    { kegiatanId: kegiatanIds[1], nama: "Scan KTM (Kartu Tanda Mahasiswa)", jenis: "file", wajib: true, urutan: 2, aktif: true },
    { kegiatanId: kegiatanIds[1], nama: "Pas Foto 3x4 Background Merah", jenis: "file", wajib: true, urutan: 3, aktif: true },
    { kegiatanId: kegiatanIds[1], nama: "Surat Rekomendasi Komisariat", jenis: "file", wajib: false, urutan: 4, aktif: true },
    { kegiatanId: kegiatanIds[1], nama: "Motivasi mengikuti DAD", jenis: "teks", wajib: true, urutan: 5, aktif: true },
    { kegiatanId: kegiatanIds[1], nama: "Bersedia mengikuti seluruh rangkaian kegiatan", jenis: "checkbox", wajib: true, urutan: 6, aktif: true },
    // DAM FKIP (kegiatanId: kegiatanIds[2])
    { kegiatanId: kegiatanIds[2], nama: "Scan KTA (Kartu Tanda Anggota)", jenis: "file", wajib: true, urutan: 1, aktif: true },
    { kegiatanId: kegiatanIds[2], nama: "Scan Sertifikat DAD", jenis: "file", wajib: true, urutan: 2, aktif: true },
    { kegiatanId: kegiatanIds[2], nama: "Essay tentang kepemimpinan Islam", jenis: "teks", wajib: true, urutan: 3, aktif: true },
    { kegiatanId: kegiatanIds[2], nama: "Bersedia mengikuti seluruh rangkaian kegiatan", jenis: "checkbox", wajib: true, urutan: 4, aktif: true },
  ];

  for (const p of persyaratanData) {
    await prisma.persyaratan.create({ data: p });
  }
  console.log("✅ Persyaratan dibuat");

  // 5. Peserta (sample data)
  const pesertaData = [
    { noPendaftaran: "DAD-2026-0001", kegiatanId: kegiatanIds[0], namaLengkap: "Ahmad Fauzi", nim: "2026010001", tempatLahir: "Jakarta", tanggalLahir: "2004-05-12", jenisKelamin: "L", email: "ahmad@mail.com", noHp: "081234567890", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FKIP", prodi: "Pendidikan Bahasa Indonesia", komisariat: "FKIP", alamat: "Jl. KH Ahmad Dahlan No. 10, Jakarta Selatan", status: "Terverifikasi", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0002", kegiatanId: kegiatanIds[0], namaLengkap: "Siti Nurhaliza", nim: "2026010002", tempatLahir: "Bandung", tanggalLahir: "2004-08-25", jenisKelamin: "P", email: "siti@mail.com", noHp: "081234567891", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FEB", prodi: "Manajemen", komisariat: "FEB", alamat: "Jl. Cempaka Putih No. 5, Jakarta Pusat", status: "Menunggu", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0003", kegiatanId: kegiatanIds[0], namaLengkap: "Budi Santoso", nim: "2026010003", tempatLahir: "Surabaya", tanggalLahir: "2003-11-03", jenisKelamin: "L", email: "budi@mail.com", noHp: "081234567892", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FT", prodi: "Teknik Informatika", komisariat: "FT", alamat: "Jl. Matraman No. 20, Jakarta Timur", status: "Terverifikasi", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0004", kegiatanId: kegiatanIds[0], namaLengkap: "Rina Wati", nim: "2026010004", tempatLahir: "Yogyakarta", tanggalLahir: "2004-02-14", jenisKelamin: "P", email: "rina@mail.com", noHp: "081234567893", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FISIP", prodi: "Ilmu Komunikasi", komisariat: "FISIP", alamat: "Jl. Gatot Subroto No. 15, Jakarta Selatan", status: "Menunggu", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0005", kegiatanId: kegiatanIds[0], namaLengkap: "Doni Pratama", nim: "2026010005", tempatLahir: "Medan", tanggalLahir: "2003-07-08", jenisKelamin: "L", email: "doni@mail.com", noHp: "081234567894", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FK", prodi: "Kedokteran Umum", komisariat: "FK", alamat: "Jl. Salemba Raya No. 8, Jakarta Pusat", status: "Ditolak", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0006", kegiatanId: kegiatanIds[0], namaLengkap: "Fatimah Az-Zahra", nim: "2026010006", tempatLahir: "Semarang", tanggalLahir: "2004-01-20", jenisKelamin: "P", email: "fatimah@mail.com", noHp: "081234567895", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FKIP", prodi: "Pendidikan Matematika", komisariat: "FKIP", alamat: "Jl. Cilandak No. 12, Jakarta Selatan", status: "Terverifikasi", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0007", kegiatanId: kegiatanIds[0], namaLengkap: "Rizki Ramadhan", nim: "2026010007", tempatLahir: "Makassar", tanggalLahir: "2004-06-15", jenisKelamin: "L", email: "rizki@mail.com", noHp: "081234567896", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FEB", prodi: "Akuntansi", komisariat: "FEB", alamat: "Jl. Kemang No. 7, Jakarta Selatan", status: "Menunggu", berkas: [], jawaban: [] },
    { noPendaftaran: "DAD-2026-0008", kegiatanId: kegiatanIds[0], namaLengkap: "Dewi Sartika", nim: "2026010008", tempatLahir: "Palembang", tanggalLahir: "2004-03-10", jenisKelamin: "P", email: "dewi@mail.com", noHp: "081234567897", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FT", prodi: "Teknik Sipil", komisariat: "FT", alamat: "Jl. Sudirman No. 30, Jakarta Pusat", status: "Terverifikasi", berkas: [], jawaban: [] },
  ];

  for (const p of pesertaData) {
    await prisma.peserta.create({ data: p });
  }
  console.log("✅ Peserta dibuat");

  console.log("\n🎉 Seeding selesai!");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
