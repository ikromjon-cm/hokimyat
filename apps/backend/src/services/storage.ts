import crypto from "crypto";
import fs from "fs";
import path from "path";
import { config } from "../config";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "selfies");
const ENCRYPTION_KEY = Buffer.from(config.selfieEncryptionKey.padEnd(32, "x").slice(0, 32));
const IV_LENGTH = 16;

function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 });
  }
}

export function encryptBuffer(buffer: Buffer): { encrypted: Buffer; iv: string; authTag: string } {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { encrypted, iv: iv.toString("hex"), authTag: authTag.toString("hex") };
}

export function decryptBuffer(encrypted: Buffer, ivHex: string, authTagHex: string): Buffer {
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function saveSelfie(
  employeeId: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ filePath: string; fileHash: string }> {
  ensureUploadDir();

  const { encrypted, iv, authTag } = encryptBuffer(buffer);
  const fileName = `${employeeId}_${Date.now()}.enc`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const header = JSON.stringify({ iv, authTag, mimeType, originalName: fileName }) + "\n";
  const combined = Buffer.concat([Buffer.from(header), encrypted]);

  fs.writeFileSync(filePath, combined);

  const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

  return { filePath, fileHash };
}

export function readSelfie(filePath: string): { data: Buffer; mimeType: string } {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(UPLOAD_DIR, filePath);
  const combined = fs.readFileSync(fullPath);

  const headerEnd = combined.indexOf("\n");
  const header = JSON.parse(combined.slice(0, headerEnd).toString());
  const encrypted = combined.slice(headerEnd + 1);

  const decrypted = decryptBuffer(encrypted, header.iv, header.authTag);
  return { data: decrypted, mimeType: header.mimeType };
}

export function deleteSelfie(filePath: string): void {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(UPLOAD_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}
