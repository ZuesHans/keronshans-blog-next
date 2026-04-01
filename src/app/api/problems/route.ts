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
  } catch (error) {
    console.error("GET /api/problems error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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

// PUT /api/problems - update a problem (auth required)
export async function PUT(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id, title, url, platform, status, tags, date, note, analysis } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await env.DB.prepare(
      "UPDATE problems SET title = ?, url = ?, platform = ?, status = ?, tags = ?, date = ?, note = ?, analysis = ?, updated_at = datetime('now', '+8 hours') WHERE id = ?"
    ).bind(title?.trim() || "", url?.trim() || "", platform || "cf", status || "AC", JSON.stringify(tags || []), date || "", note || "", analysis || "", id).run();
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
