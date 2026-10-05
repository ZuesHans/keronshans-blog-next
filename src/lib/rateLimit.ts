import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface RateLimitResult { allowed: boolean; retryAfter: number; available: boolean }

export function getClientIp(request: Request): string {
  const host = new URL(request.url).hostname;
  if (host === "localhost" || host === "127.0.0.1") return "local-dev";
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown";
}

export async function checkRateLimit(request: Request, scope: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const resetAt = (Math.floor(now / windowMs) + 1) * windowMs;
  try {
    const { env } = await getCloudflareContext({ async: true });
    const salt = process.env.PUBLIC_IDENTITY_SECRET || process.env.ADMIN_SESSION_SECRET || "";
    if (process.env.NODE_ENV === "production" && salt.length < 32) return { allowed: false, retryAfter: 30, available: false };
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${getClientIp(request)}`));
    const actor = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const key = `${scope}:${actor}:${resetAt}`;
    // A single SQL statement claims the count across all Worker instances.
    const row = await env.DB.prepare("INSERT INTO rate_limit_buckets (bucket_key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(bucket_key) DO UPDATE SET count = MIN(count + 1, ?) RETURNING count")
      .bind(key, resetAt, limit + 1).first<{ count: number }>();
    if (!row) throw new Error("No rate limit result");
    await env.DB.prepare("DELETE FROM rate_limit_buckets WHERE reset_at < ?").bind(now - 24 * 60 * 60 * 1000).run();
    return { allowed: row.count <= limit, retryAfter: Math.ceil((resetAt - now) / 1000), available: true };
  } catch {
    return { allowed: false, retryAfter: 30, available: false };
  }
}
