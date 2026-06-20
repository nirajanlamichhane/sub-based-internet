import { randomBytes } from "crypto";

/** Generate a cryptographically random token for vouchers or gateway keys */
export function generateToken(length = 16): string {
  return randomBytes(length).toString("base64url").slice(0, length);
}
