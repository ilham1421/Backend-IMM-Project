import { writeCollection, writeSingleton } from "../src/lib/storage.js";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Mulai seeding data lokal...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Users
  const users = [
    {
      id: 1,
      nama: "Super Administrator",
      username: "superadmin",
      password: hashedPassword,
      role: "superadmin",
      komisariat: null,
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      nama: "Hasan Basri",
      username: "admin_fkip",
      password: hashedPassword,
      role: "admin",
      komisariat: "FKIP",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      nama: "Aisyah Putri",
      username: "admin_feb",
      password: hashedPassword,
      role: "admin",
      komisariat: "FEB",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      nama: "Umar Faruq",
      username: "admin_ft",
      password: hashedPassword,
      role: "admin",
      komisariat: "FT",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 5,
      nama: "Khadijah Sari",
      username: "admin_fisip",
      password: hashedPassword,
      role: "admin",
      komisariat: "FISIP",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 6,
      nama: "Zainab Fitri",
      username: "admin_fk",
      password: hashedPassword,
      role: "admin",
      komisariat: "FK",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 7,
      nama: "Abdullah Hakim",
      username: "admin_fai",
      password: hashedPassword,
      role: "admin",
      komisariat: "FAI",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 8,
      nama: "Salma Azzahra",
      username: "admin_fh",
      password: hashedPassword,
      role: "admin",
      komisariat: "FH",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 9,
      nama: "Ridwan Kamil",
      username: "admin_fikes",
      password: hashedPassword,
      role: "admin",
      komisariat: "FIKES",
      aktif: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  writeCollection("users", users);
  console.log("✅ Users dibuat");

  // 2. Kegiatan (setiap PIKOM punya kegiatan sendiri, independen)
  const kegiatan = [
    {
      id: 1,
      namaKegiatan: "Darul Arqam Dasar 2026 - FKIP",
      singkatan: "DAD",
      deskripsi: "Perkaderan utama IMM Komisariat FKIP untuk membentuk kader militan, intelektual, dan berakhlak mulia.",
      tanggalMulai: "2026-04-15",
      tanggalSelesai: "2026-04-17",
      lokasi: "Gedung FKIP, Universitas Muhammadiyah Jakarta",
      kuotaPeserta: 30,
      batasRegistrasi: "2026-04-10",
      statusBuka: true,
      komisariatIds: [1],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      namaKegiatan: "Darul Arqam Dasar 2026 - FT",
      singkatan: "DAD",
      deskripsi: "Perkaderan utama IMM Komisariat FT untuk membentuk kader militan, intelektual, dan berakhlak mulia.",
      tanggalMulai: "2026-04-20",
      tanggalSelesai: "2026-04-22",
      lokasi: "Gedung FT, Universitas Muhammadiyah Jakarta",
      kuotaPeserta: 25,
      batasRegistrasi: "2026-04-15",
      statusBuka: true,
      komisariatIds: [3],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      namaKegiatan: "Darul Arqam Madya 2026 - FKIP",
      singkatan: "DAM",
      deskripsi: "Perkaderan lanjutan IMM Komisariat FKIP untuk memperdalam wawasan keislaman dan kepemimpinan.",
      tanggalMulai: "2026-06-10",
      tanggalSelesai: "2026-06-13",
      lokasi: "Gedung FKIP, Universitas Muhammadiyah Jakarta",
      kuotaPeserta: 20,
      batasRegistrasi: "2026-06-05",
      statusBuka: false,
      komisariatIds: [1],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  writeCollection("kegiatan", kegiatan);
  console.log("✅ Kegiatan dibuat");

  // 3. Persyaratan (per kegiatan, setiap PIKOM bisa punya persyaratan berbeda)
  const persyaratan = [
    // Persyaratan DAD FKIP (kegiatanId: 1)
    { id: 1, kegiatanId: 1, nama: "Scan KTA (Kartu Tanda Anggota)", jenis: "file", wajib: true, urutan: 1, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, kegiatanId: 1, nama: "Scan KTM (Kartu Tanda Mahasiswa)", jenis: "file", wajib: true, urutan: 2, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, kegiatanId: 1, nama: "Pas Foto 3x4 Background Merah", jenis: "file", wajib: true, urutan: 3, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 4, kegiatanId: 1, nama: "Alasan mengikuti DAD", jenis: "teks", wajib: true, urutan: 4, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 5, kegiatanId: 1, nama: "Bersedia mengikuti seluruh rangkaian kegiatan", jenis: "checkbox", wajib: true, urutan: 5, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    // Persyaratan DAD FT (kegiatanId: 2) — beda persyaratan dengan FKIP
    { id: 6, kegiatanId: 2, nama: "Scan KTA (Kartu Tanda Anggota)", jenis: "file", wajib: true, urutan: 1, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 7, kegiatanId: 2, nama: "Scan KTM (Kartu Tanda Mahasiswa)", jenis: "file", wajib: true, urutan: 2, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 8, kegiatanId: 2, nama: "Pas Foto 3x4 Background Merah", jenis: "file", wajib: true, urutan: 3, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 9, kegiatanId: 2, nama: "Surat Rekomendasi Komisariat", jenis: "file", wajib: false, urutan: 4, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 10, kegiatanId: 2, nama: "Motivasi mengikuti DAD", jenis: "teks", wajib: true, urutan: 5, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 11, kegiatanId: 2, nama: "Bersedia mengikuti seluruh rangkaian kegiatan", jenis: "checkbox", wajib: true, urutan: 6, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    // Persyaratan DAM FKIP (kegiatanId: 3)
    { id: 12, kegiatanId: 3, nama: "Scan KTA (Kartu Tanda Anggota)", jenis: "file", wajib: true, urutan: 1, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 13, kegiatanId: 3, nama: "Scan Sertifikat DAD", jenis: "file", wajib: true, urutan: 2, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 14, kegiatanId: 3, nama: "Essay tentang kepemimpinan Islam", jenis: "teks", wajib: true, urutan: 3, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 15, kegiatanId: 3, nama: "Bersedia mengikuti seluruh rangkaian kegiatan", jenis: "checkbox", wajib: true, urutan: 4, aktif: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  writeCollection("persyaratan", persyaratan);
  console.log("✅ Persyaratan dibuat");

  // 4. Komisariat
  const komisariat = [
    { id: 1, nama: "FKIP", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 2, nama: "FEB", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 3, nama: "FT", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 4, nama: "FISIP", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 5, nama: "FK", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 6, nama: "FAI", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 7, nama: "FH", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 8, nama: "FIKES", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];
  writeCollection("komisariat", komisariat);
  console.log("✅ Komisariat dibuat");

  // 5. Peserta
  const peserta = [
    { id: 1, noPendaftaran: "DAD-2026-0001", kegiatanId: 1, namaLengkap: "Ahmad Fauzi", nim: "2026010001", tempatLahir: "Jakarta", tanggalLahir: "2004-05-12", jenisKelamin: "L", email: "ahmad@mail.com", noHp: "081234567890", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FKIP", prodi: "Pendidikan Bahasa Indonesia", komisariat: "FKIP", alamat: "Jl. KH Ahmad Dahlan No. 10, Jakarta Selatan", status: "Terverifikasi", createdAt: "2026-03-15T08:00:00.000Z", updatedAt: "2026-03-15T08:00:00.000Z", berkas: [] },
    { id: 2, noPendaftaran: "DAD-2026-0002", kegiatanId: 1, namaLengkap: "Siti Nurhaliza", nim: "2026010002", tempatLahir: "Bandung", tanggalLahir: "2004-08-25", jenisKelamin: "P", email: "siti@mail.com", noHp: "081234567891", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FEB", prodi: "Manajemen", komisariat: "FEB", alamat: "Jl. Cempaka Putih No. 5, Jakarta Pusat", status: "Menunggu", createdAt: "2026-03-15T09:00:00.000Z", updatedAt: "2026-03-15T09:00:00.000Z", berkas: [] },
    { id: 3, noPendaftaran: "DAD-2026-0003", kegiatanId: 1, namaLengkap: "Budi Santoso", nim: "2026010003", tempatLahir: "Surabaya", tanggalLahir: "2003-11-03", jenisKelamin: "L", email: "budi@mail.com", noHp: "081234567892", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FT", prodi: "Teknik Informatika", komisariat: "FT", alamat: "Jl. Matraman No. 20, Jakarta Timur", status: "Terverifikasi", createdAt: "2026-03-14T08:00:00.000Z", updatedAt: "2026-03-14T08:00:00.000Z", berkas: [] },
    { id: 4, noPendaftaran: "DAD-2026-0004", kegiatanId: 1, namaLengkap: "Rina Wati", nim: "2026010004", tempatLahir: "Yogyakarta", tanggalLahir: "2004-02-14", jenisKelamin: "P", email: "rina@mail.com", noHp: "081234567893", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FISIP", prodi: "Ilmu Komunikasi", komisariat: "FISIP", alamat: "Jl. Gatot Subroto No. 15, Jakarta Selatan", status: "Menunggu", createdAt: "2026-03-14T09:00:00.000Z", updatedAt: "2026-03-14T09:00:00.000Z", berkas: [] },
    { id: 5, noPendaftaran: "DAD-2026-0005", kegiatanId: 1, namaLengkap: "Doni Pratama", nim: "2026010005", tempatLahir: "Medan", tanggalLahir: "2003-07-08", jenisKelamin: "L", email: "doni@mail.com", noHp: "081234567894", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FK", prodi: "Kedokteran Umum", komisariat: "FK", alamat: "Jl. Salemba Raya No. 8, Jakarta Pusat", status: "Ditolak", createdAt: "2026-03-13T08:00:00.000Z", updatedAt: "2026-03-13T08:00:00.000Z", berkas: [] },
    { id: 6, noPendaftaran: "DAD-2026-0006", kegiatanId: 1, namaLengkap: "Fatimah Az-Zahra", nim: "2026010006", tempatLahir: "Semarang", tanggalLahir: "2004-01-20", jenisKelamin: "P", email: "fatimah@mail.com", noHp: "081234567895", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FKIP", prodi: "Pendidikan Matematika", komisariat: "FKIP", alamat: "Jl. Cilandak No. 12, Jakarta Selatan", status: "Terverifikasi", createdAt: "2026-03-13T09:00:00.000Z", updatedAt: "2026-03-13T09:00:00.000Z", berkas: [] },
    { id: 7, noPendaftaran: "DAD-2026-0007", kegiatanId: 1, namaLengkap: "Rizki Ramadhan", nim: "2026010007", tempatLahir: "Makassar", tanggalLahir: "2004-06-15", jenisKelamin: "L", email: "rizki@mail.com", noHp: "081234567896", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FEB", prodi: "Akuntansi", komisariat: "FEB", alamat: "Jl. Kemang No. 7, Jakarta Selatan", status: "Menunggu", createdAt: "2026-03-12T08:00:00.000Z", updatedAt: "2026-03-12T08:00:00.000Z", berkas: [] },
    { id: 8, noPendaftaran: "DAD-2026-0008", kegiatanId: 1, namaLengkap: "Dewi Sartika", nim: "2026010008", tempatLahir: "Palembang", tanggalLahir: "2004-03-10", jenisKelamin: "P", email: "dewi@mail.com", noHp: "081234567897", universitas: "Universitas Muhammadiyah Jakarta", fakultas: "FT", prodi: "Teknik Sipil", komisariat: "FT", alamat: "Jl. Sudirman No. 30, Jakarta Pusat", status: "Terverifikasi", createdAt: "2026-03-12T09:00:00.000Z", updatedAt: "2026-03-12T09:00:00.000Z", berkas: [] },
  ];
  writeCollection("peserta", peserta);
  console.log("✅ Peserta dibuat");

  console.log("\n🎉 Seeding selesai! Data tersimpan di folder /data/");
}

seed().catch(console.error);
