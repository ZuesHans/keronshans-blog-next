import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Deploy through the verified release workflow", code: "RELEASE_API_DISABLED" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
