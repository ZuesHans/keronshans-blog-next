import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdminMutation } from "@/lib/adminPassword";
import { readJsonBody } from "@/lib/request";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT id, content, mood, created_at FROM talks ORDER BY created_at DESC LIMIT 50").all();
    return NextResponse.json((results || []).map((row: Record<string, unknown>) => ({ id: row.id, content: row.content, mood: row.mood, createdAt: row.created_at })));
  } catch {
    return NextResponse.json({ error: "Interaction service unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (!(await authenticateAdminMutation(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bodyResult = await readJsonBody(request, 8192);
    if (!bodyResult.ok || !bodyResult.value || typeof bodyResult.value !== "object" || Array.isArray(bodyResult.value)) return NextResponse.json({ error: bodyResult.ok ? "Invalid request" : bodyResult.error }, { status: bodyResult.ok ? 400 : bodyResult.status });
    const { content, mood } = bodyResult.value as { content?: unknown; mood?: unknown };
    if (typeof content !== "string" || !content.trim() || content.length > 2000 || (typeof mood !== "undefined" && typeof mood !== "string")) {
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
    if (!(await authenticateAdminMutation(request))) {
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
