import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT * FROM talks ORDER BY created_at DESC").all();
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const auth = request.headers.get("x-admin-password");
    if (!auth || auth !== "zues1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, mood } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await env.DB
      .prepare("INSERT INTO talks (nickname, content, mood) VALUES (?, ?, ?)")
      .bind("Keronshans", content.trim(), mood || "default")
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/talks error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const auth = request.headers.get("x-admin-password");
    if (!auth || auth !== "zues1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await env.DB.prepare("DELETE FROM talks WHERE id = ?").bind(Number(id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/talks error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
