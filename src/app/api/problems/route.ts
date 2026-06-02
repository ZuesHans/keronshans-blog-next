import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

// GET /api/problems - list all problems (public)
export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT * FROM problems ORDER BY created_at DESC").all();
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}

// POST /api/problems - create a problem (auth required)
export async function POST(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id, title, url, platform, status, tags, date, note, analysis } = await request.json();
    if (!id || !title?.trim() || !url?.trim()) {
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
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id, title, url, platform, status, tags, date, note, analysis } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // Build dynamic update query - only update fields that are explicitly provided
    const updates: string[] = [];
    const values: unknown[] = [];

    if (title !== undefined) { updates.push("title = ?"); values.push(title.trim()); }
    if (url !== undefined) { updates.push("url = ?"); values.push(url.trim()); }
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
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
