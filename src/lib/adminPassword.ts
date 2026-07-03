export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export const ADMIN_SESSION_COOKIE = "keronshans_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 6;

const encoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToText(value: string): string {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function timingSafeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

async function signPayload(payload: string): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function getCookie(request: Request, name: string): string {
  const cookie = request.headers.get("cookie") || "";
  const prefix = `${name}=`;
  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || "";
}

export async function verifyAdminPassword(input: string): Promise<boolean> {
  const password = getAdminPassword();
  const candidate = String(input || "").trim();
  if (!password || !candidate) return false;
  const [candidateHash, passwordHash] = await Promise.all([sha256(candidate), sha256(password)]);
  return timingSafeEqual(candidateHash, passwordHash);
}

export async function createAdminSessionToken(): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS;
  const payload = textToBase64Url(JSON.stringify({ role: "admin", exp: expiresAt }));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra !== undefined) return false;
  const expected = await signPayload(payload);
  if (!expected || !timingSafeEqual(signature, expected)) return false;

  try {
    const data = JSON.parse(base64UrlToText(payload)) as { role?: unknown; exp?: unknown };
    return data.role === "admin" && typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function adminCookieOptions(request: Request) {
  const url = new URL(request.url);
  return {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export async function authenticateAdmin(request: Request): Promise<boolean> {
  return verifyAdminSessionToken(getCookie(request, ADMIN_SESSION_COOKIE));
}
