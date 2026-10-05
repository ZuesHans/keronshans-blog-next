import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { authenticateAdminMutation } from "@/lib/adminPassword";
import { getLocalProblems } from "@/lib/localProblems";
import { readJsonBody } from "@/lib/request";

// GET /api/problems - list all problems (public)
export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT id, title, url, platform, status, tags, date FROM problems ORDER BY created_at DESC LIMIT 100").all();
    if (!results || results.length === 0) return NextResponse.json(getLocalProblems());
    return NextResponse.json((results || []).map((row: Record<string, unknown>) => ({ id: row.id, title: row.title, url: row.url, platform: row.platform, status: row.status, tags: row.tags, date: row.date })));
  } catch {
    return NextResponse.json(getLocalProblems());
  }
}

// POST /api/problems - create a problem (auth required)
export async function POST(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bodyResult = await readJsonBody(request, 32 * 1024);
    if (!bodyResult.ok || !bodyResult.value || typeof bodyResult.value !== "object" || Array.isArray(bodyResult.value)) return NextResponse.json({ error: bodyResult.ok ? "Invalid request" : bodyResult.error }, { status: bodyResult.ok ? 422 : bodyResult.status });
    const { id, title, url, platform, status, tags, date, note, analysis } = bodyResult.value as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim() || typeof title !== "string" || !title.trim() || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "id, title and url are required" }, { status: 400 });
    }
    await env.DB.prepare(
      "INSERT OR REPLACE INTO problems (id, title, url, platform, status, tags, date, note, analysis, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))"
    ).bind(id, title.trim(), url.trim(), platform || "cf", status || "AC", JSON.stringify(tags || []), date || "", note || "", analysis || "").run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/problems error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/problems - update specific fields of a problem (auth required)
export async function PUT(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const bodyResult = await readJsonBody(request, 32 * 1024);
    if (!bodyResult.ok || !bodyResult.value || typeof bodyResult.value !== "object" || Array.isArray(bodyResult.value)) return NextResponse.json({ error: bodyResult.ok ? "Invalid request" : bodyResult.error }, { status: bodyResult.ok ? 422 : bodyResult.status });
    const { id, title, url, platform, status, tags, date, note, analysis } = bodyResult.value as Record<string, unknown>;
    if (typeof id !== "string" || !id.trim()) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Build dynamic update query - only update fields that are explicitly provided
    const updates: string[] = [];
    const values: unknown[] = [];

    if (title !== undefined) { if (typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "title is invalid" }, { status: 422 }); updates.push("title = ?"); values.push(title.trim()); }
    if (url !== undefined) { if (typeof url !== "string" || !url.trim()) return NextResponse.json({ error: "url is invalid" }, { status: 422 }); updates.push("url = ?"); values.push(url.trim()); }
    if (platform !== undefined) { updates.push("platform = ?"); values.push(platform); }
    if (status !== undefined) { updates.push("status = ?"); values.push(status); }
    if (tags !== undefined) { updates.push("tags = ?"); values.push(JSON.stringify(tags)); }
    if (date !== undefined) { updates.push("date = ?"); values.push(date); }
    if (note !== undefined) { updates.push("note = ?"); values.push(note); }
    if (analysis !== undefined) { updates.push("analysis = ?"); values.push(analysis); }
    updates.push("updated_at = datetime('now', '+8 hours')");
    values.push(id);

    await env.DB.prepare(`UPDATE problems SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/problems error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/problems?id=xxx - delete a problem (auth required)
export async function DELETE(request: Request) {
  if (!(await authenticateAdminMutation(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await env.DB.prepare("DELETE FROM problems WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/problems error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
