import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log("[Email] SMTP not configured");
    return false;
  }

  try {
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || "noreply@uychi-majlis.uz";
    await t.sendMail({ from, ...options });

    await prisma.notificationLog.create({
      data: {
        type: "SYSTEM_ALERT",
        channel: "EMAIL",
        recipient: options.to,
        subject: options.subject,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);

    await prisma.notificationLog.create({
      data: {
        type: "SYSTEM_ALERT",
        channel: "EMAIL",
        recipient: options.to,
        subject: options.subject,
        status: "FAILED",
        error: (error as Error).message,
        sentAt: new Date(),
      },
    });

    return false;
  }
}

export async function sendMeetingInvite(
  email: string,
  meeting: { title: string; date: Date; startTime: Date; endTime?: Date; location?: string; agenda?: string }
): Promise<boolean> {
  const dateStr = meeting.date.toLocaleDateString("uz-UZ", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const startStr = meeting.startTime.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  const endStr = meeting.endTime?.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a1a2e; color: #fff; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${meeting.title}</h1>
      </div>
      <div style="background: #fff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p><strong>Sana:</strong> ${dateStr}</p>
        <p><strong>Boshlanish:</strong> ${startStr}</p>
        ${endStr ? `<p><strong>Tugash:</strong> ${endStr}</p>` : ""}
        ${meeting.location ? `<p><strong>Joy:</strong> ${meeting.location}</p>` : ""}
        ${meeting.agenda ? `<p><strong>Kun tartibi:</strong></p><p>${meeting.agenda}</p>` : ""}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">UYCHI MAJLIS - Hokimiyat ichki boshqaruv tizimi</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Taklif: ${meeting.title}`,
    html,
  });
}

export async function sendAttendanceReport(
  email: string,
  report: { period: string; presentDays: number; totalDays: number; lateDays: number }
): Promise<boolean> {
  const rate = ((report.presentDays / report.totalDays) * 100).toFixed(1);

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a73e8; color: #fff; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h2 style="margin: 0;">Davomat hisoboti</h2>
      </div>
      <div style="background: #fff; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p><strong>Davr:</strong> ${report.period}</p>
        <p><strong>Kelgan kunlar:</strong> ${report.presentDays} / ${report.totalDays}</p>
        <p><strong>Kech qolishlar:</strong> ${report.lateDays}</p>
        <p><strong>Davomat foizi:</strong> ${rate}%</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">UYCHI MAJLIS - Hokimiyat ichki boshqaruv tizimi</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Davomat hisoboti: ${report.period}`,
    html,
  });
}
