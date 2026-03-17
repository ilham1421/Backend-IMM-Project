import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const FROM_NAME = process.env.MAIL_FROM_NAME || "Perkaderan IMM";
const FROM_EMAIL = process.env.SMTP_USER || "noreply@imm.or.id";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendStatusChangeEmail(
  to: string,
  namaLengkap: string,
  noPendaftaran: string,
  statusBaru: string
): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log(`[Email] SMTP belum dikonfigurasi. Skip kirim email ke ${to}`);
    return false;
  }

  const statusLabel: Record<string, { text: string; color: string; emoji: string }> = {
    Terverifikasi: { text: "Diterima / Terverifikasi", color: "#16a34a", emoji: "✅" },
    Ditolak: { text: "Ditolak", color: "#dc2626", emoji: "❌" },
    Menunggu: { text: "Menunggu Verifikasi", color: "#d97706", emoji: "⏳" },
  };

  const info = statusLabel[statusBaru] || statusLabel.Menunggu;

  const safeNama = escapeHtml(namaLengkap);
  const safeNoPendaftaran = escapeHtml(noPendaftaran);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #C41E3A; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Perkaderan IMM</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px;">Ikatan Mahasiswa Muhammadiyah</p>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px 24px; border-radius: 0 0 12px 12px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Assalamu'alaikum <strong>${safeNama}</strong>,</p>
        <p style="color: #374151; font-size: 14px; margin: 0 0 20px;">
          Status pendaftaran kamu dengan nomor <strong>${safeNoPendaftaran}</strong> telah diperbarui:
        </p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 6px;">Status Pendaftaran</p>
          <p style="font-size: 22px; font-weight: bold; color: ${info.color}; margin: 0;">
            ${info.emoji} ${info.text}
          </p>
        </div>
        ${statusBaru === "Terverifikasi" ? `
        <p style="color: #374151; font-size: 14px; margin: 0 0 12px;">
          Selamat! Pendaftaran kamu telah diverifikasi. Silakan persiapkan diri untuk mengikuti kegiatan perkaderan.
        </p>` : ""}
        ${statusBaru === "Ditolak" ? `
        <p style="color: #374151; font-size: 14px; margin: 0 0 12px;">
          Mohon maaf, pendaftaran kamu belum dapat diterima. Silakan hubungi panitia untuk informasi lebih lanjut.
        </p>` : ""}
        <p style="color: #6b7280; font-size: 13px; margin: 20px 0 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          Email ini dikirim secara otomatis oleh sistem. Jangan membalas email ini.
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject: `${info.emoji} Status Pendaftaran ${safeNoPendaftaran} — ${info.text}`,
      html,
    });
    console.log(`[Email] Berhasil kirim ke ${to} — Status: ${statusBaru}`);
    return true;
  } catch (error) {
    console.error(`[Email] Gagal kirim ke ${to}:`, error);
    return false;
  }
}
