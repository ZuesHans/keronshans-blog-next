import { getClientIp } from "./rateLimit";

const encoder = new TextEncoder();

export async function getClientActorHash(request: Request): Promise<string | null> {
  const secret = process.env.PUBLIC_IDENTITY_SECRET || "";
  if (secret.length < 32) return null;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(getClientIp(request)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
