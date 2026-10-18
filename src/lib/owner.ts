/**
 * Owner exclusion: Luis's own devices never send visitor pings or saved events.
 *
 * Visiting /api/owner?key=<OWNER_KEY> once per browser sets an HttpOnly cookie
 * holding an HMAC of the key, so the cookie cannot be forged without the key.
 * OWNER_IPS still works as a second check (notify.ts).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "lg_owner";

function ownerToken(): string | null {
  const key = process.env.OWNER_KEY?.trim();
  return key ? createHmac("sha256", key).update("gimenez.dev owner").digest("hex") : null;
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** True when `key` matches OWNER_KEY. */
export function isOwnerKey(key: string | null): boolean {
  const expected = process.env.OWNER_KEY?.trim();
  return Boolean(expected && key && same(key, expected));
}

/** Cookie value to set after a valid key, or null when OWNER_KEY is unset. */
export function ownerCookieValue(): string | null {
  return ownerToken();
}

/** True when the request carries a valid owner cookie. */
export function isOwnerRequest(req: Request): boolean {
  const token = ownerToken();
  if (!token) return false;
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${OWNER_COOKIE}=([a-f0-9]{64})`));
  return Boolean(m && same(m[1], token));
}
