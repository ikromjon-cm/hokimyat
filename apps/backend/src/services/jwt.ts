import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { JwtPayload } from "../middleware/auth";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export function generateTokenPair(payload: {
  userId: string;
  phone: string;
  role: string;
  roleId: string;
  organizationId?: string;
  departmentId?: string;
  employeeId?: string;
}): TokenPair {
  const jti = uuidv4();

  const accessToken = jwt.sign(
    {
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role,
      roleId: payload.roleId,
      organizationId: payload.organizationId,
      departmentId: payload.departmentId,
      employeeId: payload.employeeId,
      jti,
    } as JwtPayload,
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    {
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role,
      jti: uuidv4(),
      type: "refresh",
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );

  const accessTokenExpiresAt = new Date(Date.now() + parseDuration(config.jwt.accessExpiresIn));
  const refreshTokenExpiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn));

  return { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt };
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}
