import { NextRequest, NextResponse } from "next/server";
import { generatedContentSnapshot } from "@/generated/contentSnapshot";

export function middleware(request: NextRequest) {
  let pathname = request.nextUrl.pathname;
  try { pathname = decodeURIComponent(pathname); } catch { return new NextResponse("Not Found", { status: 404 }); }
  const registry = generatedContentSnapshot.registry as { entries?: readonly { canonicalPath: string; aliases: readonly string[]; state: string }[] } | null;
  const entry = registry?.entries?.find((item) => item.canonicalPath === pathname || item.aliases.includes(pathname));
  if (entry?.state === "withdrawn") return new NextResponse("Gone", { status: 410, headers: { "Cache-Control": "no-store" } });
  if (entry && entry.canonicalPath !== pathname) return NextResponse.redirect(new URL(entry.canonicalPath, request.url), 308);
  return NextResponse.next();
}

export const config = {
  matcher: ["/posts/:path*", "/templates/:path*", "/snippets/:path*"],
};
