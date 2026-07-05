import PDFDocument from "pdfkit";
import { prisma } from "./prisma";

interface DocumentHeader {
  organizationName: string;
  documentNumber: string;
  date: Date;
  title: string;
}

export async function generateAttendanceCertificate(
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<Buffer> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      user: true,
      department: true,
      organization: true,
      attendance: {
        where: {
          date: { gte: startDate, lte: endDate },
          type: "CHECK_IN",
        },
        orderBy: { date: "asc" },
      },
    },
  });

  if (!employee) throw new Error("Employee not found");

  const presentDays = new Set(
    employee.attendance.map((a) => new Date(a.date).toDateString())
  ).size;
  const totalDays = getWorkingDays(startDate, endDate);
  const lateDays = employee.attendance.filter((a) => {
    const hour = new Date(a.timestamp || a.createdAt).getHours();
    return hour >= 9;
  }).length;

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk));

  const header: DocumentHeader = {
    organizationName: employee.organization.name,
    documentNumber: `MA-${Date.now().toString(36).toUpperCase()}`,
    date: new Date(),
    title: "DAVOMAT MA'LUMOTNOMASI",
  };

  drawHeader(doc, header);
  doc.moveDown(2);

  doc.fontSize(11).font("Helvetica");
  doc.text(`Xodim: ${employee.user.fullName || "Noma'lum"}`);
  doc.text(`Bo'lim: ${employee.department.name}`);
  doc.text(`Lavozim: ${employee.position || "Xodim"}`);
  doc.moveDown();
  doc.text(`Davr: ${formatDate(startDate)} - ${formatDate(endDate)}`);
  doc.moveDown();
  doc.text(`Kelgan kunlar: ${presentDays} / ${totalDays}`);
  doc.text(`Kech qolishlar: ${lateDays} ta`);
  doc.text(`Davomat foizi: ${totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0}%`);
  doc.moveDown(2);

  doc.text(`Ushbu ma'lumotnoma ${formatDate(new Date())} kuni berildi.`, { align: "center" });
  doc.moveDown();
  doc.text("___________________", { align: "right" });
  doc.fontSize(10).text("Mas'ul shaxs imzosi", { align: "right" });

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
}

export async function generateMeetingMinutes(
  meetingId: string
): Promise<Buffer> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      createdBy: { include: { user: true } },
      participants: {
        include: { employee: { include: { user: true } } },
      },
      overseers: {
        include: { employee: { include: { user: true } } },
      },
    },
  });

  if (!meeting) throw new Error("Meeting not found");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk));

  const header: DocumentHeader = {
    organizationName: meeting.organizationId,
    documentNumber: `MN-${Date.now().toString(36).toUpperCase()}`,
    date: new Date(),
    title: "MAJLIS BAYONI",
  };

  drawHeader(doc, header);
  doc.moveDown(2);

  doc.fontSize(14).font("Helvetica-Bold").text(meeting.title, { align: "center" });
  doc.moveDown();
  doc.fontSize(11).font("Helvetica");
  doc.text(`Sana: ${formatDate(meeting.date)}`);
  doc.text(`Boshlanish: ${formatTime(meeting.startTime)}`);
  if (meeting.endTime) doc.text(`Tugash: ${formatTime(meeting.endTime)}`);
  if (meeting.location) doc.text(`Joy: ${meeting.location}`);
  if (meeting.isOnline) doc.text(`Online: ${meeting.meetingLink || "Ha"}`);
  doc.moveDown();
  doc.text(`Rais: ${meeting.createdBy?.user?.fullName || "Noma'lum"}`);
  doc.moveDown();

  doc.font("Helvetica-Bold").text("Qatnashchilar:");
  doc.font("Helvetica");
  const confirmed = meeting.participants.filter((p) => p.status === "CONFIRMED" || p.status === "PRESENT");
  for (const p of confirmed) {
    doc.text(`  ${p.employee?.user?.fullName || "Noma'lum"} - ${getStatusLabel(p.status)}`);
  }

  if (meeting.overseers?.length) {
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Kuzatuvchilar:");
    doc.font("Helvetica");
    for (const o of meeting.overseers) {
      doc.text(`  ${o.employee?.user?.fullName || "Noma'lum"}`);
    }
  }

  if (meeting.agenda) {
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Kun tartibi:");
    doc.font("Helvetica").text(meeting.agenda);
  }

  doc.moveDown(2);
  doc.fontSize(10).text("Bayon haqiqiy va ko'rsatilgan ma'lumotlar to'g'ri.", { align: "center" });
  doc.moveDown();
  doc.text("___________________", { align: "right" });
  doc.fontSize(10).text("Kotib imzosi", { align: "right" });

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
}

export async function generateOrderDocument(
  organizationId: string,
  orderData: {
    orderNumber: string;
    title: string;
    preamble: string;
    content: string;
    assignees?: { name: string; task: string }[];
    effectiveDate: Date;
  }
): Promise<Buffer> {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organization not found");

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const buffers: Buffer[] = [];
  doc.on("data", (chunk) => buffers.push(chunk));

  const header: DocumentHeader = {
    organizationName: org.name,
    documentNumber: orderData.orderNumber,
    date: new Date(),
    title: orderData.title,
  };

  drawHeader(doc, header);
  doc.moveDown(2);

  doc.fontSize(14).font("Helvetica-Bold").text("BUYRUQ", { align: "center" });
  doc.moveDown();
  doc.fontSize(11).font("Helvetica");
  doc.text(orderData.preamble);
  doc.moveDown();

  doc.font("Helvetica-Bold").text("B U Y U R A M A N:");
  doc.moveDown(0.5);
  doc.font("Helvetica").text(orderData.content);

  if (orderData.assignees?.length) {
    doc.moveDown();
    doc.font("Helvetica-Bold").text("Topshiriqlar:");
    doc.font("Helvetica");
    for (let i = 0; i < orderData.assignees.length; i++) {
      doc.text(`${i + 1}. ${orderData.assignees[i].name}: ${orderData.assignees[i].task}`);
    }
  }

  doc.moveDown();
  doc.text(`Buyruq ${formatDate(orderData.effectiveDate)} kundan kuchga kiradi.`);
  doc.moveDown(3);
  doc.text("Rahbar: ___________________", { align: "right" });

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
  });
}

function drawHeader(doc: typeof PDFDocument.prototype, header: DocumentHeader) {
  doc.fontSize(10).font("Helvetica");
  doc.text(header.organizationName, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(16).font("Helvetica-Bold").text(header.title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica");
  doc.text(`№ ${header.documentNumber}`, { align: "right" });
  doc.text(`${formatDate(header.date)}`, { align: "right" });
  doc.moveDown(0.5);
  doc.strokeColor("#333").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const months = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} yil`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

function getWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Taklif qilingan",
    CONFIRMED: "Qatnashadi",
    DECLINED: "Rad etgan",
    ABSENT: "Kelgan",
    PRESENT: "Qatnashgan",
  };
  return labels[status] || status;
}
