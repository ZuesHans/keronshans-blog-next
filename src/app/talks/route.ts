import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect("https://talks.keronshans.top", 307);
}
