const encoder = new TextEncoder();

export const MUTATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;

export async function requestHash(value: unknown): Promise<string> {
  const bytes = encoder.encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function verifyChallenge(token: unknown, request: Request): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY || "";
  if (!secret) return process.env.NODE_ENV !== "production";
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: request.headers.get("cf-connecting-ip") || "" }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean; hostname?: string };
  return result.success === true && result.hostname === (process.env.TURNSTILE_HOSTNAME || new URL(request.url).hostname);
}
