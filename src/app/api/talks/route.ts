import { NextResponse } from "next/server";

export async function GET() {
  const env = (process.env as unknown as { DB: D1Database }).DB;
  if (!env) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    const { results } = await env.prepare("SELECT * FROM talks ORDER BY created_at DESC").all();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const env = (process.env as unknown as { DB: D1Database }).DB;
  if (!env) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const auth = request.headers.get("x-admin-password");
  if (auth !== "zues1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, mood } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await env.prepare(
      "INSERT INTO talks (nickname, content, mood) VALUES (?, ?, ?)"
    ).bind("Keronshans", content.trim(), mood || "😄").run();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const env = (process.env as unknown as { DB: D1Database }).DB;
  if (!env) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const auth = request.headers.get("x-admin-password");
  if (auth !== "zues1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await env.prepare("DELETE FROM talks WHERE id = ?").bind(id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
