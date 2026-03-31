import { NextResponse } from "next/server";

const ADMIN_PASSWORD = "zues1";

function getDB() {
  return (process.env as unknown as { DB: D1Database }).DB;
}

function authenticate(request: Request): boolean {
  return request.headers.get("x-admin-password") === ADMIN_PASSWORD;
}

// GET /api/snippets - list all snippets (public)
export async function GET() {
  const db = getDB();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  try {
    const { results } = await db.prepare("SELECT * FROM snippets ORDER BY updated_at DESC").all();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/snippets - create a new snippet (auth required)
export async function POST(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDB();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { id, title, code, language, tags } = await request.json();
    if (!id || !title?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "id, title and code are required" }, { status: 400 });
    }
    await db.prepare(
      "INSERT OR REPLACE INTO snippets (id, title, code, language, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now', '+8 hours'), datetime('now', '+8 hours'))"
    ).bind(id, title.trim(), code, language || "C++", JSON.stringify(tags || [])).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PUT /api/snippets - update a snippet (auth required)
export async function PUT(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDB();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { id, title, code, language, tags } = await request.json();
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db.prepare(
      "UPDATE snippets SET title = ?, code = ?, language = ?, tags = ?, updated_at = datetime('now', '+8 hours') WHERE id = ?"
    ).bind(title?.trim() || "", code || "", language || "C++", JSON.stringify(tags || []), id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/snippets?id=xxx - delete a snippet (auth required)
export async function DELETE(request: Request) {
  if (!authenticate(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDB();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db.prepare("DELETE FROM snippets WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
