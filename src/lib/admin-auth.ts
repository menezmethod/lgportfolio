import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison. Both values are hashed first so the buffers always have equal length. */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** True when the request carries ADMIN_SECRET in x-admin-secret or as a Bearer token. */
export function isAdminRequest(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!header) return false;
  return safeEqual(header, secret);
}
