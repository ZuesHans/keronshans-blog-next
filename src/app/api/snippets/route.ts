import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const ADMIN_PASSWORD = "zues1";

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

// GET /api/snippets - list all snippets (public)
export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { results } = await env.DB.prepare("SELECT * FROM snippets ORDER BY updated_at DESC").all();
    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/snippets error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/snippets - create a snippet (auth required)
export async function POST(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id, title, code, language, tags } = await request.json();
    if (!id || !title?.trim()) {
      return NextResponse.json({ error: "id and title are required" }, { status: 400 });
    }
    await env.DB.prepare(
      "INSERT OR REPLACE INTO snippets (id, title, code, language, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))"
    ).bind(id, title.trim(), code || "", language || "C++", JSON.stringify(tags || []), ).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/snippets error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT /api/snippets - update a snippet (auth required)
export async function PUT(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id, title, code, language, tags } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await env.DB.prepare(
      "UPDATE snippets SET title = ?, code = ?, language = ?, tags = ?, updated_at = datetime('now', '+8 hours') WHERE id = ?"
    ).bind(title?.trim() || "", code || "", language || "C++", JSON.stringify(tags || []), id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/snippets error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/snippets?id=xxx - delete a snippet (auth required)
export async function DELETE(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await env.DB.prepare("DELETE FROM snippets WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/snippets error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
