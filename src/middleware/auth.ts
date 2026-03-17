import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET_VALUE = process.env.JWT_SECRET;
if (!JWT_SECRET_VALUE) {
  console.error("❌ FATAL: JWT_SECRET environment variable is not set!");
  process.exit(1);
}

export const JWT_SECRET: string = JWT_SECRET_VALUE;

export interface AuthPayload {
  id: number;
  username: string;
  role: string;
  komisariat: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token tidak ditemukan" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid atau sudah expired" });
  }
}

export function roleMiddleware(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Tidak terautentikasi" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Akses ditolak" });
      return;
    }
    next();
  };
}
