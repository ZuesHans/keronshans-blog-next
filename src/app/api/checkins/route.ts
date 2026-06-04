import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdmin } from "@/lib/adminPassword";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT * FROM checkins ORDER BY created_at DESC").all();
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!authenticateAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, type, count, note } = await request.json();
    if (!date || !type || !count || count < 1) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await env.DB
      .prepare("INSERT INTO checkins (nickname, content, type, count, note) VALUES (?, ?, ?, ?, ?)")
      .bind("Keronshans", "", type, count, note || "")
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/checkins error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!authenticateAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM checkins WHERE id = ?").bind(Number(id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/checkins error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
