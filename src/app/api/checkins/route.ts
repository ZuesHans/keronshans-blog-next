import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdminMutation } from "@/lib/adminPassword";
import { readJsonBody } from "@/lib/request";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT id, type, count, created_at FROM checkins ORDER BY created_at DESC LIMIT 50").all();
    return NextResponse.json((results || []).map((row: Record<string, unknown>) => ({ id: row.id, type: row.type, count: row.count, date: row.created_at })));
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
    if (!bodyResult.ok || !bodyResult.value || typeof bodyResult.value !== "object" || Array.isArray(bodyResult.value)) {
      return NextResponse.json({ error: bodyResult.ok ? "Invalid data" : bodyResult.error }, { status: bodyResult.ok ? 400 : bodyResult.status });
    }
    const { date, type, count, note } = bodyResult.value as { date?: unknown; type?: unknown; count?: unknown; note?: unknown };
    if (typeof date !== "string" || typeof type !== "string" || !Number.isInteger(count) || (count as number) < 1 || (typeof note !== "undefined" && typeof note !== "string")) {
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
    if (!(await authenticateAdminMutation(request))) {
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
