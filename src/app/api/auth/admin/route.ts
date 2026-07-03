import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  authenticateAdmin,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/adminPassword";
import { checkRateLimit } from "@/lib/rateLimit";

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

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const limit = checkRateLimit(request, "admin-login", 8, 10 * 60 * 1000);
  if (!limit.allowed) return rateLimited(limit.retryAfter);

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    password = "";
  }

  if (!(await verifyAdminPassword(password))) {
    console.warn("Admin login failed", { ip: request.headers.get("cf-connecting-ip") || "unknown" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSessionToken(), adminCookieOptions(request));
  return response;
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminCookieOptions(request), maxAge: 0 });
  return response;
}
