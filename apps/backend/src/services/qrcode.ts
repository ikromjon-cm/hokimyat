import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const QR_SECRET = process.env.QR_SECRET || crypto.randomBytes(64).toString("hex");

interface QRPayload {
  meetingId: string;
  type: "check-in";
  iat: number;
  exp: number;
}

export function generateQRToken(meetingId: string): string {
  return jwt.sign(
    { meetingId, type: "check-in" } as QRPayload,
    QR_SECRET,
    { expiresIn: "24h" }
  );
}

export function verifyQRToken(token: string): QRPayload | null {
  try {
    const payload = jwt.verify(token, QR_SECRET) as QRPayload;
    if (payload.type !== "check-in") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function generateQRDataURL(token: string): Promise<string> {
  return QRCode.toDataURL(token, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });
}

export async function generateQRBuffer(token: string): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 400,
    color: { dark: "#1a1a2e", light: "#ffffff" },
  });
}
