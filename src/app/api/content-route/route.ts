import { NextResponse } from "next/server";
import { resolveContentRoute } from "@/lib/contentRegistry";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const pathname = new URL(request.url).searchParams.get("pathname") || "";
  if (!pathname.startsWith("/posts/") && !pathname.startsWith("/templates/") && !pathname.startsWith("/snippets/")) {
    return NextResponse.json({ error: "Invalid pathname" }, { status: 400 });
  }
  return NextResponse.json(resolveContentRoute(pathname), { headers: { "Cache-Control": "no-store" } });
}
