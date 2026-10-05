import { NextResponse } from "next/server";
import {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  authenticateAdmin,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/adminPassword";
import { checkRateLimit } from "@/lib/rateLimit";
import { readJsonBody } from "@/lib/request";

function rateLimited(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many attempts" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export async function GET(request: Request) {
  if (!(await authenticateAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  if (process.env.NODE_ENV === "production") response.cookies.set(ADMIN_CSRF_COOKIE, crypto.randomUUID(), { ...adminCookieOptions(request), httpOnly: false });
  return response;
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Cloudflare Access is required" }, { status: 403 });
  const limit = await checkRateLimit(request, "admin-login", 8, 10 * 60 * 1000);
  if (!limit.available) return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 });
  if (!limit.allowed) return rateLimited(limit.retryAfter);

  const bodyResult = await readJsonBody(request, 4096);
  const body = bodyResult.ok && bodyResult.value && typeof bodyResult.value === "object" && !Array.isArray(bodyResult.value)
    ? bodyResult.value as { password?: unknown }
    : {};
  const password = typeof body.password === "string" ? body.password : "";

  if (!(await verifyAdminPassword(password))) {
    console.warn("Admin login failed", { ip: request.headers.get("cf-connecting-ip") || "unknown" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSessionToken(), adminCookieOptions(request));
  response.cookies.set(ADMIN_CSRF_COOKIE, crypto.randomUUID(), { ...adminCookieOptions(request), httpOnly: false });
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminCookieOptions(request), maxAge: 0 });
  response.cookies.set(ADMIN_CSRF_COOKIE, "", { ...adminCookieOptions(request), httpOnly: false, maxAge: 0 });
  return response;
}
